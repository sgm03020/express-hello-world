const express = require('express')
const bodyParser = require('body-parser')
const router = express.Router()
const url = require('url')

const { getJwtClient } = require('../common/oauth-service-account')
const { getEvents, addEvents, getHolidays } = require('./g-calendar')

// 以下を追加
// https://qiita.com/hirochan/items/e63d74cb70f0b97889fc
//router.use(express.urlencoded({ extended: true }))
//router.use(bodyParser.urlencoded({ extended: true }))

router.get('/events', async (req, res) => {
  try {
    const result = await getEvents(req, res)
    return res.send(result)
  } catch (err) {
    console.log('err:', err)
  }
  return res.send({})
  //return res.status(400).send()
})

router.post('/addEvents', async (req, res) => {
  //console.log('addEvnets body=', req.body)
  if (typeof req.body === 'undefined')
    return res.send({ result: 'failed', message: '' })

  let test
  if (typeof req.body.test !== 'undefined') test = req.body.test

  const rr = await addEvents(req.body)
  //console.log('rr: ', rr);
  if (rr) {
    // 予約成功時にSendGrid経由でお客にメールを配信する
    //if (test) sendMailBySendGrid(req, res);
    return res.send({ result: 'success' })
  }
  return res.send({ result: 'failed', message: '' })
})

router.get('/', async (req, res) => {
  return res.status(200).send('api')
})

module.exports = router
