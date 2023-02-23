const { google } = require('googleapis')
const url = require('url')
const {
  loadClientSecrets,
  authorize,
  authorizeNoToken,
} = require('../common/oauth-helper')

// fsの場合のパス
// flex.bluemix@gmai.com
// const SECRET_PATH = './.secret/credentials.json';
// const TOKEN_PATH = './src/tokens/token-people.json';

// flex.0520.service@gmai.com => OK
// const SECRET_PATH = './.secret/credentials_flex_service.json';
// const TOKEN_PATH = './src/tokens/token-people-flex-service.json';

// flex.0520.service@gmai.comのWebクライアントのplayground経由 => OK
//const SECRET_PATH = './.secret/client_web.json';
// const TOKEN_PATH = './src/tokens/token-flex-service-playground.json';

// Renderのために修正
let ClientWebPath = '../../client_web.json'
let PlaygroundTokenPath = '../../token-flex-service-playground.json'
// Not Render (ローカル環境では、.secretフォルダに置く)
if (typeof process.env.RENDER === 'undefined') {
  ClientWebPath = '../../.secret/client_web.json'
  PlaygroundTokenPath = '../../.secret/token-flex-service-playground.json'
} else {
  if (typeof process.env.ClientWebPath !== 'undefined') {
    // Not env for path
    ClientWebPath = process.env['ClientWebPath']
  }
  if (typeof process.env.TokenPath !== 'undefined') {
    // Not env for path
    PlaygroundTokenPath = process.env['PlaygroundTokenPath']
  }
}

// render用 追加
const client_secret = require(ClientWebPath)
const play_token = require(PlaygroundTokenPath)

console.log('client_secret=', client_secret)

// 現在は下記の直書きを使っている

// Playgournd経由で画面から直接得たトークン
const TOKEN = {
  access_token:
    'ya29.a0AfH6SMB0ZBNClOeBDCgHNmaK5vhHJtCftZCfdHI4KWjOZ9QJZ_7-pTHcr-Y0au-UMizJFJMWBtDB1Kms7PMfKTiLz61zUXzdbEGjEZsXobOuHRfzRBqSJOAIwbxxgTu1TbL8VPS0GYJ-rp-YPrTJAtpC2bos',
  id_token:
    'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEzZThkNDVhNDNjYjIyNDIxNTRjN2Y0ZGFmYWMyOTMzZmVhMjAzNzQiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI2NTE2NTA4MTYwOC10MnI5M2tmcDVhbWxldmdtcTNwN2o3aXFmb2UxOHY1cy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImF1ZCI6IjY1MTY1MDgxNjA4LXQycjkza2ZwNWFtbGV2Z21xM3A3ajdpcWZvZTE4djVzLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTEzNDc3MzI5NTM1MjkwNjk2MTY1IiwiYXRfaGFzaCI6IjB0OFFsaGZLWUd0SVo5MjZRYjdTSWciLCJuYW1lIjoi5Y6f5YmbIiwicGljdHVyZSI6Imh0dHBzOi8vbGg1Lmdvb2dsZXVzZXJjb250ZW50LmNvbS8tV3V3bFpIblBFRU0vQUFBQUFBQUFBQUkvQUFBQUFBQUFBQUEvQU1adXVjbEV1eHBHYVpXMzdoUnh6X3lCb3BWSWUtRlFldy9zOTYtYy9waG90by5qcGciLCJnaXZlbl9uYW1lIjoi5YmbIiwiZmFtaWx5X25hbWUiOiLljp8iLCJsb2NhbGUiOiJqYSIsImlhdCI6MTYxNzQzMjM5MCwiZXhwIjoxNjE3NDM1OTkwfQ.IXskidXUiEQPGClwPOR9utsoxkYPKdblmU8vuuKPQu30p8J3_h3WdbQuBfb0bE5Sg8nY0t6FB0o8inwa1jkXu7v8k_Yaob4uW2dRz2oF5II9RufoiTHIRjha_PVob-JivAWPoNgRy4bWX4TUC9Mfpv7Z3M7rx2eKcDBF1pgzcCKvW0gFazqWg_OHbgCrFfYI5u3WMyBN_9jB1C3sTJtluLbkHuKu70vHRzVIzRkBviE199Btnsj9S_9p48STFVka7H2j6rWs8_wj1XzMv9aZNDqyiLa4a5jkdlTd4i3f_0_JtKtODLNla4EBPdB_Oz1ZZqyZ5Ld97zrjZR5ZDjav8w',
  expires_in: 3599,
  token_type: 'Bearer',
  scope:
    'https://mail.google.com/ https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/contacts',
  refresh_token:
    '1//04V_-POMk1Jk4CgYIARAAGAQSNwF-L9IrK2vcJHhdvSUSaa45jWwx70K63Y_6g8KOsGXTbIUP4aDiNuAS_hUJFoqdQZs0i-JqcHU',
}

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/userinfo.profile',
]

// 指定したメールアドレスを持つpeople情報
/**
 *
 * @param addr
 */
async function getPeople(addr) {
  // console.log('addr: ', addr);
  // const { addr } = req.body;
  // if (!addr) {
  //   return;
  // }
  try {
    //const secrets = await loadClientSecrets(ClientWebPath)
    //console.log('ClientWebPath: ', ClientWebPath)
    //console.log('secrets: ', secrets)

    // 1) OK authorize (トークンパス指定)
    // const oAuth2Client = await authorize(secrets, SCOPES, TOKEN_PATH);

    // 2) OK authorizeNoToken + setCredentials (トークンJSONデータを直接指定)
    // --- START 2) ---
    const oAuth2Client = await authorizeNoToken(client_secret, SCOPES)
    oAuth2Client.setCredentials(play_token)
    // --- END 2) ---

    const service = google.people({ version: 'v1', auth: oAuth2Client })
    // https://developers.google.com/people/api/rest/v1/people.connections/list
    // { data: people }の意味はdataをpeopleという別名にしてアクセスできる
    // ということを意味する
    let found
    let pageToken
    do {
      // const { data: people } = await service.people.connections.list({
      const { data } = await service.people.connections.list({
        resourceName: 'people/me', // 必須
        personFields: 'names,emailAddresses,phoneNumbers', // names,emailAddresses,phoneNumbers
        pageSize: 999,
        pageToken: pageToken,
      })
      //console.log('data: ', data);
      // 方法 1)
      // found = data.connections.find((v) => {
      //   if (v.emailAddresses) {
      //     return v.emailAddresses.find((el) => el.value === addr);
      //   } else {
      //     return false;
      //   }
      // });
      // 方法 2)
      found = data.connections.find(
        (v) =>
          v.emailAddresses && v.emailAddresses.some((el) => el.value === addr)
      )
      // console.log('found0: ', found);

      if (found) break
      pageToken = data.nextPageToken
      // console.log('pageToken: ', pageToken);
    } while (pageToken)

    // console.log('found: ', found);
    // 一致するメールアドレスが見つかった
    if (found) return found
    // console.log('not found ', addr);
    return
  } catch (err) {
    console.log('err: ', err)
    return
  }
}

// 指定したメールアドレスを持つpeople情報があるか・ないか
/**
 *
 * @param email
 */
async function isPeople(email) {
  const found = getPeople(email) || null
  if (found) return true
  return false
}

// 全連絡先を取得
// apiとして使うのではないが、ここへ置いた
async function getAllPeople() {
  // Authorize a client with credentials, then call the Google Calendar API.
  const secrets = loadClientSecrets(ClientWebPath)
  // const oAuth2Client = await authorize(secrets, SCOPES, TOKEN_PATH);
  // 以下(TOKEN直書きを使う場合)
  // ここから
  const oAuth2Client = await authorizeNoToken(secrets, SCOPES)
  oAuth2Client.setCredentials(TOKEN)
  // ここまで
  const service = google.people({ version: 'v1', auth: oAuth2Client })
  // https://developers.google.com/people/api/rest/v1/people.connections/list
  // { data: people }の意味はdataをpeopleという別名にしてアクセスできる
  // ということを意味する
  const { data } = await service.people.connections.list({
    resourceName: 'people/me', // 必須
    personFields: 'names,emailAddresses,phoneNumbers', // names,emailAddresses,phoneNumbers
    pageSize: 999,
  })
  //
  // console.log('data.connections ', data.connections);
  // email確認
  // data.connections.forEach(el => {
  //   const { emailAddresses } = el;
  //   console.log('emailAddresses: ', emailAddresses);
  // });
  return data.connections || []
}

/**
 *
 */
async function getAllEmail() {
  const people = await getAllPeople()
  // []の状態
  if (people) {
    // [ {resourceName:'abc', emailAddresses: [ {metadata:{...}, value:'xyz@xyz.com'}, {} ]}, ...]
    // となっているものを emailだけでflat化する
    // ['xyz@xyz.com', 'abc@abc.com'.....]
    // 別に for..ofでなくても良い
    const result = (await people).reduce((acc, val) => {
      for (const elm of val['emailAddresses']) {
        // console.log('elm: ', elm);
        // console.log("elm:", elm['value']);
        // 1) push
        // acc.push(elm['value']);
        // 2) concat
        acc = acc.concat(elm['value'])
      }
      return acc
    }, [])
    // console.log("result:", result);
    return result
  }
  return []
}

/**
 *
 */
async function writePeopleToBlob() {
  const peopleContainer = await createPeopleContainer('people')
  const blobName = 'people' + '.json'
  const blockBlobClient = peopleContainer.getBlockBlobClient(blobName)
  // 保存データ
  const contentRaw = ['xyz@xyz.com', 'abc@abc.com', 'klm@klm.com'].sort()
  const content = JSON.stringify(contentRaw)
  const uploadBlobResponse = await blockBlobClient.upload(
    content,
    content.length
  )
  context.log('uploadBlobResponse: ', uploadBlobResponse)

  return (context.res = {
    status: 200,
    body: { result: 'OK', message: 'not found', info: storageUrl } || {},
  })
}

// 複数の関数をエクスポートする場合
module.exports = {
  isPeople,
  getPeople,
  getAllPeople,
  getAllEmail,
}
