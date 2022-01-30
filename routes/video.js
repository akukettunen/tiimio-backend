const { v4: uuidv4 } = require('uuid');
const express = require('express');
      router = express.Router()
      db = require('../utils/db/index')
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      clip_db = require('../utils/db/clip')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      ngrok = require('ngrok');
      hook_helper = require('../utils/video/hooks')

router.post('/', async (req, res) => {
  const id = uuidv4()

  var url
  if(process.env.ENVIRONMENT == 'dev') {
    try {
      url = await ngrok.connect({
        authtoken: '23Kxqjxnw95qyK4s3L9Wblm4lUP_2onZXof3fyYzo13jpL9Hs',
        addr: 4040
      });
    } catch(err) {
      throw new Error('ngrok tunnel failed: ', err)
    }
  }

  const params = {
    "settings": {
      "ultrafast": true
    },
    "input": { "url": req.body.original_url },
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
      'metadata': { id }
    }
  }

  let job;
  try {
    job = await coconut.createJob(params)
  } catch(err) {
    throw new Error('coconut job create failed')
  }

  await video_db.postVideo({
    ...req.body,
    id,
    job_id: job.id,
    service: 'coconut',
    uploader: req.tiimio_user.email
  })

  let [ video ] = await video_db.videoById(id)

  res.send({ video, job })
})

router.get('/:id/encoding-state', async (req, res) => {
  let [ video ] = await video_db.videoById(req.params.id)

  if(!video) throw new Error('video not found')

  let job_data;

  switch(video.service) {
    case 'coconut':
      job_data = await coconut.jobState(video.job_id)
      break;
    default:
      throw new Error('job not found')
  }

  res.json(job_data)
})

router.get('/team/:id', async (req, res) => {
  // TODO: vain oman joukkueen videot

  let videos = await video_db.teamVideos(req.params.id)
  res.send(videos)
})

router.get('/:id', async (req, res) => {
  // TODO: vain oman joukkueen videot

  let [ video ] = await video_db.videoById(req.params.id)
  
  if(!video) throw new Error('video not found')
  
  let clips = await clip_db.videoClips(video.id)

  res.json( { ...video, clips } )
})

router.post('/webhook', (req, res) => {
  switch (req.body.event) {
    case 'job.completed':
      hook_helper.jobDone(req.body)
  }

  res.send('ok!')
})

module.exports = router;