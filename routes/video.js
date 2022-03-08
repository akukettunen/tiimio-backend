require('dotenv')
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const { user, is_in_team } = require('../middleware/authMiddleware');
      router = express.Router()
      db = require('../utils/db/index')
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      logger = require('../utils/logger')
      video_db = require('../utils/db/video')
      aws = require('../utils/aws/index')
      clip_db = require('../utils/db/clip')
      time_db = require('../utils/db/time')
      timeHelper = require('../utils/time/timeHelper')
      coconut = require('../utils/coconut/index')
      coconut_configs = require('../utils/coconut/configs')
      ngrok = require('ngrok');
      hook_helper = require('../utils/video/hooks')
      require('express-async-errors');

router.post('/', user, async (req, res) => {
  // id should be in form 123-345/123-645
  const id = req.body.id.split('/')[0] || uuidv4()

  let url;
  if(process.env.ENVIRONMENT == 'dev') {
    try {
      url = await ngrok.connect({
        authtoken: '261uxjtMzpNTQCdpidogLCyOjx7_4K8Uyr8va1sTK4uHtpurq',
        addr: 4040
      });
    } catch(err) {
      console.log(err)
      throw new Error('ngrok tunnel failed: ', err)
    }
  } else {
    url = process.env.URL_BASE + '/video/webhook'
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
    },
    "region": process.env.COCONUT_REGION
  }

  coconut['region'] = "eu-west-1"

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

router.get('/:id/encoding-state', user, async (req, res) => {
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

router.get('/team/:id', user, async (req, res) => {
  // TODO: vain oman joukkueen videot

  let videos = await video_db.teamVideos(req.params.id)
  res.send(videos)
})

router.get('/:id', user, async (req, res) => {
  // TODO: vain oman joukkueen videot

  let [ video ] = await video_db.videoById(req.params.id)
  
  if(!video) throw new Error('video not found')
  
  let clips = await clip_db.videoClips(video.id)
  let times = await timeHelper.videoTimes(video.id)

  res.json( { ...video, clips, times } )
})

router.post('/webhook', (req, res) => {
  switch (req.body.event) {
    case 'job.completed':
      hook_helper.jobDone(req.body)
  }

  res.send('ok!')
})

router.delete('/:id', user, async (req, res) => {
  if(!req.params.id) throw new Error('bad request!')

  let [ video ] = await video_db.videoById(req.params.id)

  is_in_team(video.team_id)
  
  await aws.deleteByFolder(video.s3_key)
  await video_db.deleteById(req.params.id)

  res.json('ok!')
})

module.exports = router;