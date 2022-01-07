const express = require('express');
const { v4: uuidv4 } = require('uuid');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcrypt');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      ngrok = require('ngrok');
      hook_helper = require('../utils/video/hooks')

router.post('/', async (req, res) => {
  const id = uuidv4()

  let url
  try {
    url = await ngrok.connect({
      authtoken: '23Kxqjxnw95qyK4s3L9Wblm4lUP_2onZXof3fyYzo13jpL9Hs',
      addr: 4040
    });
  } catch(err) {
    console.log(err)
  }

  const params = 
    {
      "input": {
        "url": req.body.original_url
      },
      "outputs": coconut_configs.normal(`/${id}`),
      "storage": {
        'service': 's3',
        'bucket': process.env.COCONUT_BUCKET,
        'region': process.env.COCONUT_REGION,
        'credentials': {
          'access_key_id': process.env.COCONUT_ACCESS_KEY,
          'secret_access_key': process.env.COCONUT_SECRET_ACCESS_KEY
        }
      },
      'notification': {
        'type': 'http',
        'url': `${url}/video/webhook`,
        'metadata': {
          id
        }
      }
    }

  let job;
  try {
    job = await coconut.createJob(params)
  } catch(err) {
    console.log(err)
  }

  let video = await video_db.postVideo({
    ...req.body,
    id,
    job_id: job.id,
    service: 'coconut',
    uploader: req.tiimio_user.email
  })

  res.send({ video, job })
})

router.get('/team/:id', async (req, res) => {
  // TODO: vain oman joukkueen videot

  let videos = await video_db.teamVideos(req.params.id)
  res.send(videos)
})

router.post('/webhook', (req, res) => {
  console.log('Webhook called: ', req.body)

  switch (req.body.event) {
    case 'job.completed':
      hook_helper.jobDone(req.body)
  }

  res.send('ok!')
})

module.exports = router;