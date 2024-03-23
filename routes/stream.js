require('dotenv').config()
const express = require('express');
const { user, is_in_team } = require('../middleware/authMiddleware');
const { getChannelByArn } = require('../utils/stream/streamHelper');
      db = require('../utils/db/index')
      router = express.Router()
      bcrypt = require('bcryptjs');
      jwt = require('jsonwebtoken')
      cookieParser = require('cookie-parser')
      router.use(cookieParser())
      streamHelper = require('../utils/stream/streamHelper')
      require('express-async-errors');
      sport_db = require('../utils/db/sport')

router.post('/', async (req, res) => {
  const { team_id } = req.tiimio_user.currentTeamId
  const streamTitle = req.body.title

  is_in_team(team_id)

  const channel = await streamHelper.createChannel(streamTitle)

  res.json(channel)
})

router.delete('/', user, async (req, res) => {
  try {
    const arn = req.body.arn;
    const team_id = req.tiimio_user.currentTeamId

    is_in_team(team_id)

    const response = await streamHelper.deleteChannel(arn)

    res.json(response)
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.put('/updateDetails', user, async (req, res) => {
  // streamHelper.getChannelByArn()
  const team_id = req.tiimio_user.currentTeamId

  is_in_team(team_id)

  const {title, id} = req.body;
  const email = req.tiimio_user.email
  try {
    stream_db.addStreamDetails({email, title, id})

    res.send('ok!')
  }
  catch (error) {
    console.error('Error updating stream details:', error)
    res.status(500).json({error: 'Internal server error' })
  }
})

router.get('/channel', user, async (req, res) => {
  // const { team_id } = req.body
  const arn = req.query.arn;
  // const arn = req.body.arn

  // console.log('test')
  // console.log(arn)

  const channel = await streamHelper.getChannelByArn(arn)

  res.json(channel)
})

router.post('/webhook', async (req, res) => {
  const body = req.body;
  // const { team_id } = req.tiimio_user.currentTeamId || 404;
  // console.log(team_id)

  /*
  EXAMPLE EVENTS

  STREAM STARTED
  {
    version: '0',
    id: 'e44d4e0c-961d-d052-b548-738dca9f0159', id
    'detail-type': 'IVS Recording State Change',
    source: 'aws.ivs',
    account: '660273657420',
    time: '2023-12-13T21:46:11Z', uploaded parsena tämä
    region: 'eu-west-1',
    resources: [ 'arn:aws:ivs:eu-west-1:660273657420:channel/AXnaRrhYNf7Z' ],
    detail: {
      recording_status: 'Recording Start',
      recording_status_reason: '',
      recording_s3_bucket_name: 'tiimio-vid-prod',
      recording_s3_key_prefix: 'ivs/v1/660273657420/AXnaRrhYNf7Z/2023/12/13/21/46/y9KbtxapPKU3',
      recording_duration_ms: 0,
      channel_name: 'beffa1c9-62b7-4354-84f5-06612e2f83e8',
      stream_id: 'st-1BFfRucA3M934F2XJV2QjKO',
      recording_session_id: 'uxa0OrtRP8Rs',
      recording_session_stream_ids: [ 'st-1BFfRucA3M934F2XJV2QjKO' ]
    }
  }
  */

  /*
  {
    version: '0',
    id: '7590e6d7-4a34-6568-9b52-1e8ce76a84e7',
    'detail-type': 'IVS Recording State Change',
    source: 'aws.ivs',
    account: '660273657420',
    time: '2023-12-13T21:47:24Z',
    region: 'eu-west-1',
    resources: [ 'arn:aws:ivs:eu-west-1:660273657420:channel/AXnaRrhYNf7Z' ],
    detail: {
      recording_status: 'Recording End',
      recording_status_reason: '',
      recording_s3_bucket_name: 'tiimio-vid-prod',
      recording_s3_key_prefix: 'ivs/v1/660273657420/AXnaRrhYNf7Z/2023/12/13/21/46/y9KbtxapPKU3',
      recording_duration_ms: 70000,
      channel_name: 'beffa1c9-62b7-4354-84f5-06612e2f83e8',
      stream_id: 'st-1BFfRucA3M934F2XJV2QjKO',
      recording_session_id: 'uxa0OrtRP8Rs',
      recording_session_stream_ids: [ 'st-1BFfRucA3M934F2XJV2QjKO' ]
    }
  }

  RECORDING_ENDED_WITH_FAILURE
  */

  const live_base = "https://tiimio-vid-prod.s3.eu-west-1.amazonaws.com/"
  const base = "https://d3a8wbzbl3mii4.cloudfront.net/"
  const prefix = body.detail.recording_s3_key_prefix
  const end_prefix_recording = "/media/hls/master.m3u8"
  const end_prefix_live = "/media/hls/byte-range-multivariant.m3u8"
  const end_prefix_thumb = "/media/latest_thumbnail/thumb.jpg"

  const recording_url = base + prefix + end_prefix_recording
  const live_url = live_base + prefix + end_prefix_live
  const thumb_url = live_base + prefix + end_prefix_thumb
  const uploaded = streamHelper.parseUploaded(new Date(body.time))

  // console.log(recording_url)
  // console.log(live_url)
  // console.log(thumb_url)
  // console.log(body)

  if(body.detail.recording_status == 'Recording Start') {
    const channel = await streamHelper.getChannelByArn(body.resources[0]); // Await added here
    const datat = {
      id: body.detail.stream_id,
      team_id: 3,
      s3_key: '',
      original_url: recording_url, // nämä varmaan toisinpäin ilmeisesti
      mp4_url: live_url,
      service: 'ivs',
      title: channel.channel.tags.title || 'Name not set',
      original_type: 'hls',
      original_size: 1,
      hls_url: '',
      duration_ts: body.detail.recording_duration_ms,
      duration:  body.detail.recording_duration_ms / 1000,
      thumb_url:  thumb_url,
      uploaded: uploaded,
      encoded: true,
    }
    streamHelper.addInitialVideo(datat)
  }
  if(body.detail.recording_status == 'Recording End') {
    streamHelper.deleteChannel(body.resources[0])
    const data = {
      id: body.detail.stream_id,
      duration_ts: body.detail.recording_duration_ms,
      duration:  body.detail.recording_duration_ms / 1000,
    }
    streamHelper.addFullVideo(data)
  }



  res.send('ok!')
})

module.exports = router;