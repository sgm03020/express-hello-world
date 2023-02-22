// import { OAuth2Client, Credentials } from 'google-auth-library'
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

// 以下を追加
const REDIRECT_URIS = ['urn:ietf:wg:oauth:2.0:oob', 'http://localhost'];

// fsの場合のパス
// const TOKEN_PATH = 'server/tokens/token-contacts.json'

// downloaded ClientSecret.json file data

// If modifying these scopes, delete token.json.
// const SCOPES = [
//   'https://www.googleapis.com/auth/contacts',
//   'https://www.googleapis.com/auth/userinfo.profile'
// ]

///
/// File I/O
///
// Load client secrets from a local file.
/**
 *
 * @param {*} secretPath
 */
function loadClientSecrets(secretPath) {
  const content = fs.readFileSync(secretPath, {
    encoding: 'utf8',
  });
  return JSON.parse(content);
}

// Store the token to disk for later program executions
function storeToken(tokenPath, token) {
  fs.writeFileSync(tokenPath, JSON.stringify(token));
}

// load if we have previously stored a token.
function loadToken(tokenPath) {
  const token = fs.readFileSync(tokenPath, {
    encoding: 'utf8',
  });
  return JSON.parse(token);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 */
async function authorize(credentials, scopes, tokenPath) {
  // console.log('credentials: ', credentials);
  let oAuth2Client;
  // credentials.installedの場合はデスクトップを選択した場合に
  // jsonの構成がそうなる。しかし、redirect_uris[0]がそのjsonに入っていない
  // 場合に直接constに書いて対応した
  if (credentials.installed) {
    oAuth2Client = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      // credentials.installed.redirect_uris[0]
      REDIRECT_URIS[0] // 固定する
    );
  } else if (credentials.web) {
    oAuth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      REDIRECT_URIS[0] // 固定する
    );
  } else {
    // .installも.webもなく直書きの場合
    oAuth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      REDIRECT_URIS[0] // 固定する
    );
  }

  // Check if we have previously stored a token.
  let token;
  try {
    token = loadToken(tokenPath);
  } catch {
    // no token.json
    console.log('no token.json');
    token = await getAccessToken(oAuth2Client, scopes, tokenPath);
  }
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

/**
 * Google OAuth2 Playground経由で取得したトークンを直接指定するために
 * この関数ではtokenを指定しない
 * @param {*} credentials
 * @param {*} scopes
 */
async function authorizeNoToken(credentials, scopes) {
  // console.log('credentials: ', credentials);
  let oAuth2Client;
  // credentials.installedの場合はデスクトップを選択した場合に
  // jsonの構成がそうなる。しかし、redirect_uris[0]がそのjsonに入っていない
  // 場合に直接constに書いて対応した
  if (credentials.installed) {
    oAuth2Client = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      // credentials.installed.redirect_uris[0]
      REDIRECT_URIS[0] // 固定する
    );
  } else if (credentials.web) {
    oAuth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      REDIRECT_URIS[0] // 固定する
    );
  } else {
    // .installも.webもなく直書きの場合
    oAuth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      REDIRECT_URIS[0] // 固定する
    );
  }

  // Check if we have previously stored a token.
  // oAuth2Client.setCredentials(token);
  return oAuth2Client;
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getAccessToken(oAuth2Client, scopes, tokenPath) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log('Open this URL: ', authUrl);
  var code = await new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Paste Code: ', (code) => resolve(code));
  });

  const token = await oAuth2Client.getToken(code).catch((err) => {
    console.error('Error retrieving access token', err);
    throw err;
  });
  console.log('storeToken:', token.tokens);
  storeToken(tokenPath, token.tokens);
  return token.tokens;
}

// export { loadClientSecrets, authorize }

// 複数の関数をエクスポートする場合
module.exports = {
  loadClientSecrets,
  authorize,
  authorizeNoToken,
};
