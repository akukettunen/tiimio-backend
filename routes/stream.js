require('dotenv').config()
const express = require('express');
const { user, is_in_team } = require('../middleware/authMiddleware');
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
  const { team_id } = req.body

  const channel = await streamHelper.createChannel()

  res.json(channel)
})

router.post('/webhook', (req, res) => {
  const body = req.body;

  /*
  EXAMPLE EVENTS

  STREAM STARTED
  {
    version: '0',
    id: 'e44d4e0c-961d-d052-b548-738dca9f0159',
    'detail-type': 'IVS Recording State Change',
    source: 'aws.ivs',
    account: '660273657420',
    time: '2023-12-13T21:46:11Z',
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
  const thumb_url = base + prefix + end_prefix_thumb

  console.log(recording_url)
  console.log(live_url)
  console.log(thumb_url)

  console.log(body)

  res.send('ok!')
})

module.exports = router;