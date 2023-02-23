const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const url = require('url')

/*
const { getJwtClient } = require('../common/oauth-service-account')
const { getEvents, addEvents, getHolidays } = require('./g-calendar')

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
  const { test } = req.body
  const rr = await addEvents(req.body)
  //console.log('rr: ', rr);
  if (rr) {
    // 予約成功時にSendGrid経由でお客にメールを配信する
    //if (test) sendMailBySendGrid(req, res);
    return res.send({ result: 'success' })
  }
  return res.send({ result: 'failed', message: '' })
})
*/

router.get('/', async (req, res) => {
  return res.status(200).send('api')
})

module.exports = router
