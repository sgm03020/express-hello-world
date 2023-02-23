const fs = require('fs');
const util = require('util');
const url = require('url');
const readline = require('readline');
const axios = require('axios');
const { google } = require('googleapis');
const { getJwtClient } = require('../common/oauth-service-account');
const { loadClientSecrets, authorize } = require('../common/oauth-helper');
const CALENDAR_ID = process.env['CalendarId'];
const CALENDAR_ID_TEST = process.env['CalendarIdTest'];
const SECRET_PATH = process.env['SecretPath'];
const { getPeople } = require('./g-people');

// Google APIs JwtClient
var jwtClient;

// addEventsをGAS経由で行っていたが、googleapisだけで稼働させる手法に使う
// メールアドレス確認はこのscopesには含めない
// addEvents専用
const TOKEN_PATH_CALENDAR = process.env['TokenPathCalendar'];
const SCOPES_ADD_EVENTS = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * イベントを間引きする
 * 以下の4つのみ利用する
 * "start", "end", "colorId", "owner"(元はattendees)
 * 'owner': true or false => 独自追加(google apiには存在しない)
 *
 * @param {*} events
 */
function getFilteredEvents(addr, events) {
  const keys = ['start', 'end', 'colorId', 'attendees', 'description'];
  return events.reduce((acc, value, index) => {
    acc[index] = keys.reduce((pre, cur, i) => {
      // サービスアカウントではなく、一般アカウントからのアクセスで
      // attendeesが存在する場合
      // if (cur === 'attendees') {
      //   const array = value['attendees'];
      //   const found = array && array.find((v) => v.email === addr);
      //   if (found) pre['owner'] = true;
      //   else pre['owner'] = false;
      // } else pre[cur] = value[cur];
      // return pre;
      //
      // サービスアカウントを通して予約されたイベントには、
      // 本来attendeesを付けられない。
      // しかし、なぜか確認メール側に出欠確認の項目が含まれており、
      // そこで、「はい」等を押すと、attendeesが勝手に追加されるようだ。
      // これはバグかもしれない。
      // attendeesにオーナー自身の出欠確認があるのでそれを見る
      //
      if (cur === 'attendees') {
        const array = value['attendees'];
        const found =
          array && array.find((v) => v.responseStatus === 'accepted');
        if (found) pre['status'] = true;
        else pre['status'] = false;
      } else if (cur === 'description') {
        // const array = value['attendees'];
        // const found = array && array.find((v) => v.email === addr);
        // descriptionは文字列(存在しない場合のありえる)
        const description = value['description'];
        let found = false;
        // メールアドレスが空の場合
        if (addr && addr !== '' && description) {
          // console.log('description.indexOf(addr): ', description.indexOf(addr));
          if (description.indexOf(addr) !== -1) found = true;
        }
        if (found) pre['owner'] = true;
        else pre['owner'] = false;
      } else pre[cur] = value[cur];
      return pre;
    }, {});
    return acc;
  }, []);
}

/**
 * サービスアカウント用
 * @param {*} auth (サービスアカウントの場合はjwtClient、他はoAuth2Client)
 * @param {*} calendarId
 * @param {*} data
 */
async function addEventsHandlerServiceAccount(
  jwtclient,
  calendarId,
  data,
  people
) {
  const userEmail = (await data.email) || '';
  const userName = (await data.name) || '';

  // people情報の処理
  let name, tel;
  if (people) {
    // console.log('people: ', people);
    name = (people.names && people.names[0].displayName) || 'なし';
    tel = (people.phoneNumbers && people.phoneNumbers[0].value) || 'なし';
  }
  // console.log('people:', name, tel);
  // return false;

  // サービスアカウントによる予定の登録では G Suite契約していない場合に
  // attendeesの参加者を入れると、エラーとなる。
  // G Suite契約している場合はドメイン全体の委任を行うことにより、
  // attendeesにも参加者を登録できるらしい。
  //
  // そこで、attendeesではなく、
  // descriptionの中へ予約者のemailアドレスを入れ込むことにした
  const summary =
    userName && userName !== '' ? `${userName}さんパーソナル` : 'パーソナル';
  const event = {
    summary: summary,
    // attendees: [
    //   { ...(userEmail && { email: userEmail, responseStatus: 'accepted' }) },
    // ],
    // attendees: [
    //   { email: 'flex-415@overroad-backend-308002.iam.gserviceaccount.com', responseStatus: 'needsAction' },
    // ],
    start: {
      dateTime: data.start,
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: data.end,
      timeZone: 'Asia/Tokyo',
    },
    description: `メール: ${userEmail} 氏名: ${userName} 登録名:${name} TEL:${tel}`,
  };
  // console.log('event: ', event)
  // const calendar = google.calendar({ version: "v3", auth });
  const calendar = google.calendar('v3');
  // calendar.events.setEmail();
  const { data: insertResultData } = await calendar.events.insert({
    auth: jwtclient,
    calendarId: calendarId,
    requestBody: event,
  });
  if (insertResultData && insertResultData.status === 'confirmed') {
    // イベント追加成功
    return true;
  }
  return false;
}

/**
 * 一般アカウント用
 * @param {*} auth
 * @param {*} calendarId
 * @param {*} data
 */
async function addEventsHandler(auth, calendarId, data) {
  const userEmail = data.email;
  // サービスアカウントによる予定の登録では G Suite契約していない場合に
  // attendeesの参加者を入れると、エラーとなる。
  // G Suite契約している場合はドメイン全体の委任を行うことにより、
  // attendeesにも参加者を登録できるらしい。
  //
  const event = {
    summary: 'パーソナル',
    attendees: [
      { ...(userEmail && { email: userEmail, responseStatus: 'accepted' }) },
    ],
    start: {
      dateTime: data.start,
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: data.end,
      timeZone: 'Asia/Tokyo',
    },
  };
  // console.log('event: ', event)
  const calendar = google.calendar({ version: 'v3', auth });
  const { data: insertResultData } = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: event,
  });
  if (insertResultData && insertResultData.status === 'confirmed') {
    // イベント追加成功
    return true;
  }
  return false;
}

/**
 * テスト中
 * paramsにtimeMin等を指定できる(指定なしの場合は現在時刻～60日同時刻)
 * nextPageTokenを取得しつつループにて指定期間の全てのeventsを取得して
 * 1つの配列に格納して返却する
 *
 * @param {*} auth
 * @param {*} calendarId
 * @param {*} params
 */
async function listEvents(jwtclient, calendarId, params) {
  if (process.env.API_DEBUG === 'true') console.log('called api listEvents');
  const calendar = google.calendar('v3'); // JwtClientはここでは指定しない
  let { timeMin, timeMax, maxResults } = params || {};
  // console.log("timeMin: ", timeMin);
  // 指定なしの場合、現在時刻～60日同時刻まで
  const max = 50;
  // timeMin, timeMax未指定の場合
  if (!timeMin) {
    timeMin = new Date().toISOString();
  }
  if (!timeMax) {
    timeMax = new Date(Date.parse(timeMin) + 60 * 60 * 60 * 24 * 1000);
  }
  let nextPageToken = 'first';
  let count = 0;
  let limits = 10;
  // let list;
  let array = [];
  while (nextPageToken && count <= limits) {
    // console.log("count: ", count);
    const { data } = await calendar.events
      .list({
        auth: jwtclient, // service accountでJwtClientを使う(oauth2はservice accountでは提供されていない)
        calendarId: calendarId, // calendarId NGテスト: 'abc' 'primary',
        ...((nextPageToken &&
          nextPageToken !== 'first' && { pageToken: nextPageToken }) ||
          {}),
        ...((nextPageToken &&
          nextPageToken === 'first' &&
          timeMin && { timeMin }) ||
          {}),
        ...((nextPageToken &&
          nextPageToken === 'first' &&
          timeMax && { timeMax }) ||
          {}),
        ...((maxResults && { maxResults }) || { maxResults: max }),
        singleEvents: true,
        orderBy: 'startTime',
      })
      .catch((err) => {
        console.log('The API returned an error throw: ' + err);
        // エラーでは上位でnullを返す
        throw err;
      });
    let events = data.items;
    // let filteredEvents = getFilteredEvents(addr, data.items);
    // console.log("data.etag: ", data.etag);
    // console.log('data.nextPageToken: ', data.nextPageToken);
    // console.log('events.length: ', events.length);
    nextPageToken = data.nextPageToken;
    if (events) {
      // 1)
      // array = array.concat(events);
      // 2)
      Array.prototype.push.apply(array, events);
      // console.log("array: ", array);
    }
    count++;
  }
  //
  // console.log("array: ", array);
  return array;
}

/**
 * listEvents2を呼ぶ関数
 */
async function getEvents(req, res) {
  let events;
  let _calendarId = CALENDAR_ID;

  try {
    const { addr, test } = url.parse(req.url, true).query;

    // test=true指定でCalendarIDをテスト用に指定する
    if (test) {
      _calendarId = CALENDAR_ID_TEST;
    }

    //
    if (!jwtClient) {
      jwtClient = await getJwtClient();
    }
    events = await listEvents(jwtClient, _calendarId, (params = {}));
    // console.log('events: ', events);
    // events.map((el) => {
    //   console.log(el.attendees)
    // })

    // console.log('all events length: ', events.length);
    // 間引き
    const filteredEvents = getFilteredEvents(addr, events);
    // console.log('filteredEvents: ', filteredEvents);
    return filteredEvents;
  } catch (err) {
    console.log('ERROR', err);
  }
  return;
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
async function addEvents(req) {
  // console.log('addEvents');
  // addEventsHandlerの結果格納
  let result = 'failed';
  let _calendarId = CALENDAR_ID;
  // 1) 前半部 メールアドレスをNeDBまたは、最新のPeople情報からチェックする
  // メールアドレスチェック
  // console.log('req: ', req);
  // const email = req.email || req.body.email || undefined;
  // const name = req.name || req.body.name || undefined;
  let email;
  let name;
  if (req && req.email) {
    email = req.email;
  }
  if (req && req.name) {
    name = req.name;
  }
  // メールなしの場合は失敗させる
  if (!email || email === '') return;

  // test=true指定でCalendarIDをテスト用に指定する
  let test = false;
  if (req && req.test) {
    test = req.test;
  } else if (req && req.body && req.body.test) {
    test = req.test;
  }
  // console.log('req: ', req);
  // console.log('test: ', test);
  if (test) {
    _calendarId = CALENDAR_ID_TEST;
  }
  // res = {
  //   status: 200,
  //   body: { result: "OK" } || {},
  // };
  // return;

  // ここまでazure blob利用版

  // res = {
  //   status: 200,
  //   body: { result } || {},
  // };
  // return;

  // 2021.4.3 追加処理
  // メールアドレス確認、名前、電話番号取得
  let people;
  try {
    people = await getPeople(email);
    // console.log('people: ', people);
  } catch (err) {
    console.log('getPeople error:', err);
  }

  // 2) 後半部(予約登録)

  // メールアドレスチェックをクリアした場合は予約実行
  const data = {
    email,
    name,
    start: req.start || req.body.start,
    end: req.end || req.body.end,
  };

  try {
    // 1) サービスアカウント用
    // people情報を追加
    const ret = await addEventsHandlerServiceAccount(
      jwtClient,
      _calendarId,
      data,
      people
    );
    // 2) 通常のアカウント用(oauth2)
    // const secrets = loadClientSecrets(SECRET_PATH);
    // const oauth2Client = await authorize(secrets, SCOPES_ADD_EVENTS, TOKEN_PATH_CALENDAR);
    // const ret = await addEventsHandler(oauth2Client, CALENDAR_ID, data);

    // 成功ならば "success"
    if (ret) result = 'success';
    // console.log('ret: ', ret);
    //
    return result;
  } catch (err) {
    console.log('addEventsHandler err:', err);
  }
  //finally {
  // ここでreturnしない方がよい(しては行けない)
  // finallyを使わない方がよい
  // return res.send({ result: false })
  //}
  // console.log('addEvents result: ', result)
  // const obj = { result }
  // console.log('obj: ', obj)
  // { result : true or false }の形式で返す
  // return context.res.send({ result });
  // return (res = {
  //   status: 200,
  //   headers: {
  //     'Access-Control-Allow-Headers':
  //       'Origin, X-Requested-With, Content-Type, Accept',
  //     'Access-Control-Allow-Origin': '*',
  //     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  //     'Access-Control-Allow-Credentials': true,
  //   },
  //   body: { result } || {},
  // });

  return;
}

/**
 * 祝日を取得
 * @param {*} req
 */
async function getHolidays(req) {
  let timeMin, timeMax;
  // const calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
  const calendarId = 'japanese__ja@holiday.calendar.google.com';
  const apiKey = 'AIzaSyAIZNFf53vxs3p9E-8rtP8f_qdjWnjPH9Q';
  // let { start, end } = url.parse(req.url, true).query || undefined;
  // // start = req.start || req.body.start;
  // // end = req.end || req.body.end;

  // timeMin, timeMax未指定の場合
  // 現在の日付から60日間の祝日データを取得する
  timeMin = new Date().toISOString();
  timeMax = new Date(
    Date.parse(timeMin) + 60 * 60 * 60 * 24 * 1000
  ).toISOString();
  const params = {
    key: apiKey,
    timeMin,
    timeMax,
    maxResults: 20,
    singleEvents: true,
    orderBy: 'startTime',
  };

  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;
  // const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`;
  // const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}`;
  //https://www.googleapis.com/calendar/v3/calendars/japanese__ja@holiday.calendar.google.com/events?key=AIzaSyAIZNFf53vxs3p9E-8rtP8f_qdjWnjPH9Q
  try {
    const result = await axios.get(url, { params });
    let filteredArray;
    // endは次の日になっているが
    // 現状、startの日付のみ対応すれば良さそう
    if (result.data && result.data.items) {
      filteredArray = result.data.items.map((el) => el.start.date);
    }
    // console.log('filteredArray: ', filteredArray);
    return filteredArray;
  } catch (err) {
    console.log('err:', err);
    return;
  }
}

/**
 * 日付のヘルパー関数(現在未使用)
 * https://developers.google.com/apps-script/advanced/calendar
 * Helper function to get a new Date object relative to the current date.
 * を元に単に時刻等を0とする
 */
function getDateZeroTime(days) {
  let _d = new Date();
  let d = new Date(_d.getFullYear(), _d.getMonth(), _d.getDate(), 0, 0, 0);
  if (days) d.setDate(_d.getDate() + days);
  return d;
}

// main
async function main() {
  jwtClient = await getJwtClient();
}
main().catch((e) => console.log(e));

module.exports = { getEvents, addEvents, getHolidays };
