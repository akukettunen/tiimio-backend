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
const dynamoDb = new AWS.DynamoDB.DocumentClient();

router.get('/presigned-url', user, async (req, res) => {
  let { fileName, fileType, clip_id, layer_id } = req.query;

  // Check that the user is in the team
  const [ clip ] = await clip_db.clipById(clip_id)
  if(!clip) throw new Error('clip not found :/')
  const [ video ] = await video_db.videoById(clip.video_id)
  inline_is_in_team(video.team_id, req)
  
  const s3Params = {
    Bucket: process.env.CLIP_AWS_S3_BUCKET,
    Key: fileName,
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
  const { team_id } = req.body;

  inline_is_in_team(team_id, req)

  const stateMachineArn = process.env.CLIP_EXPORT_STATE_MACHINE
  const input = JSON.stringify(req.body);

  const params = {
    stateMachineArn,
    input
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

// Route to get export state by team_id
router.get('/export-state/team/:team_id', user, (req, res) => {
  const params = {
    TableName: 'tiimi-clip-exports',
    IndexName: 'team_id-index',
    KeyConditionExpression: 'team_id = :teamId',
    ExpressionAttributeValues: {
      ':teamId': parseInt(req.params.team_id),
    },
  };

  dynamoDb.query(params, (error, result) => {
    if (error) {
      console.error('Error fetching export state by team_id:', error);
      res.status(500).json({ error: 'Could not fetch export state by team_id' });
    } else {
      res.json(result.Items);
    }
  });
});

router.get('/export-state/clip/:clip_id', user, async (req, res) => {
  const [ clip ] = await clip_db.clipById(req.params.clip_id)

  if(!clip) {
    throw new Error('Clip not found')
  }

  inline_is_in_team(clip.team_id, req)

  const params = {
    TableName: 'tiimi-clip-exports',
    IndexName: 'clip_id-index',
    KeyConditionExpression: 'clip_id = :clipId',
    ExpressionAttributeValues: {
      ':clipId': parseInt(req.params.clip_id), // Assuming clip_id is a string. If it's a number, you might need to convert it, e.g., parseInt(req.params.clip_id)
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();
    if (result.Items.length > 0) {
      res.json(result.Items);
    } else {
      res.send(null)
    }
  } catch (error) {
    console.error('Error fetching export state by clip_id:', error);
    res.status(500).json({ error: 'Could not fetch export state by clip_id' });
  }
});

// Route to get the export object by export_id
router.get('/export-state/:export_id', (req, res) => {
  const params = {
    TableName: 'tiimi-clip-exports',
    Key: {
      'export_id': req.params.export_id,
    },
  };

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.error('Error fetching export object by export_id:', error);
      res.status(500).json({ error: 'Could not fetch export object by export_id' });
    } else {
      if (result.Item) {
        res.json(result.Item);
      } else {
        res.send(null)
      }
    }
  });
});



module.exports = router;