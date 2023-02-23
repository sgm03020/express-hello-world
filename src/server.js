require('dotenv').config()
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const routes = require('./api');

// CORS
const cors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
}

// ignore request for FavIcon. so there is no error in browser
const ignoreFavicon = (req, res, next) => {
  if (req.originalUrl.includes('favicon.ico')) {
    res.status(204).end()
  }
  next()
}

// fn to create express server
const create = async () => {
  const app = express()
  // CORSを許可する
  app.use(cors)
  app.use(ignoreFavicon)

  // routes
  app.use('/api', routes);

  //app.get('/', (req, res) => res.send('Hello World'))
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/client.html'))
  })
  return app
}

module.exports = {
  create,
}

/* Old Code

// dotenv
// https://maku77.github.io/nodejs/env/dotenv.html
require('dotenv').config()
if (typeof process.env.VAR1 == 'undefined') {
  //console.error('Error: "KEY1" is not set.');
  //console.error('Please consider adding a .env file with KEY1.');
  //process.exit(1);
}

const express = require('express')
const app = express()
const fs = require('fs')

const port = process.env.PORT || 3001

//console.log('__dirname=', __dirname)
//console.log('process.env=', process.env)

//(async() => {
//  //dResultを使った処理
//})();

app.get('/', (req, res) => res.type('html').send(html))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Render!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      Hello from Render!
    </section>
  </body>
</html>
`
*/
