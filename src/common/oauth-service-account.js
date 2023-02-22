const { google } = require('googleapis')
// const privatekey = require('../../.secret/personal-secret.json');
// const privatekey = require('../../.secret/overroad-backend-secret.json');
// const privatekey = require('../../overroad-backend-secret.json');

let privatekey
if (typeof process.env.OverroadBackendSecretPath === 'undefined') {
} else {
  const OVERROAD_BACKEND_SECRET_PATH = process.env['OverroadBackendSecretPath']
  console.log('OVERROAD_BACKEND_SECRET_PATH: ', OVERROAD_BACKEND_SECRET_PATH)
  if (OVERROAD_BACKEND_SECRET_PATH) {
    privatekey = require(OVERROAD_BACKEND_SECRET_PATH)
    console.log('privatekey[type]: ', privatekey['type'])
  }
}

// GOOGLE_APPLICATION_CREDENTIALS
// 手順
// 1) herokuの環境変数として SERVICE_ACCOUNT_CREDENTIALS を作り
//    GCPからダウンロードしたキーファイルの内容を貼り付ける
// 2) .profileを作る
//    echo ${SERVICE_ACCOUNT_CREDENTIALS} > /.secret/personal-secret.json
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
}

const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.external_request',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.google.com/m8/feeds',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/contacts.readonly',
]

// https://developers.google.com/search/apis/indexing-api/v3/get-token?hl=ja
// https://googleapis.dev/nodejs/googleapis/latest/tasks/

// new google.auth.OAuth2
// const auth = new google.auth.GoogleAuth({
//   credentials: privatekey,
//   SCOPES,
// });
// let auth, authClient, jwtClient;

;(async function () {})()

async function getJwtClient() {
  // JWT形式の認証クライアント生成
  const jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    SCOPES
  )
  await jwtClient.authorize()
  // 旧コード
  // jwtClient.authorize(async function (err, tokens) {
  //   if (err) {
  //     console.log(err);
  //     return;
  //   } else {
  //     console.log('Successfully connected!');
  //     // OK console.log('tokens.access_token: ', tokens.access_token);
  //     // OK console.log('jwtClient.getRequestHeaders(): ', await jwtClient.getRequestHeaders());
  //   }
  // });
  // console.log('jwtClient.getRequestHeaders(): ', await jwtClient.getRequestHeaders());
  return jwtClient
}

module.exports = { getJwtClient }
