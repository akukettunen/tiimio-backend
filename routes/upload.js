require('dotenv')
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const { user, is_in_team, inline_is_in_team } = require('../middleware/authMiddleware');
      router = express.Router()
      clip_db = require('../utils/db/clip')
      aws = require('aws-sdk')
      require('express-async-errors');

aws.config.update({
  accessKeyId: process.env.STEP_FUNCTIONS_AWS_KEY,
  secretAccessKey: process.env.STEP_FUNCTIONS_SECRET_AWS_KEY,
  region: process.env.COCONUT_REGION
});

const s3 = new AWS.S3();
const stepfunctions = new AWS.StepFunctions();

router.get('/presigned-url', user, async (req, res) => {
  let { fileName, fileType, clip_id, layer_id } = req.query;
  fileName = layer_id + ':' + clip_id + ':' + fileName

  // Check that the user is in the team
  const [ clip ] = await clip_db.clipById(clip_id)
  if(!clip) throw new Error('clip not found :/')
  const [ video ] = await video_db.videoById(clip.video_id)
  inline_is_in_team(video.team_id, req)
  
  const s3Params = {
    Bucket: process.env.CLIP_AWS_S3_BUCKET,
    Key: 'clip_graphics/' + fileName,
    Expires: 60 * 5, // Expires in 60 seconds
    ContentType: fileType,
    ACL: 'private',
  };

  let url = `https://${process.env.CLIP_AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if (err) {
      console.log('Presigning post data encountered an error', err);
      return res.status(500).send('Error creating presigned URL');
    }
    res.json({
      signedRequest: data,
      url,
    });
  });
})

router.post('/start-clip-processing', user, async (req, res) => {
  // TODO check that video is in group

  const arn = process.env.CLIP_EXPORT_STATE_MACHINE
  const input = JSON.stringify(req.body);

  const params = {
    stateMachineArn: arn,
    input: input,
  };

  try {
    const execution = await stepfunctions.startExecution(params).promise();
    res.json({
      message: 'Step Function execution started successfully',
      executionArn: execution.executionArn,
      startDate: execution.startDate
    });
  } catch (error) {
    console.error('Error starting Step Function execution:', error);
    res.status(500).send('Failed to start Step Function execution');
  }
})



module.exports = router;