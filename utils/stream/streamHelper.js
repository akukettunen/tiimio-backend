const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
require('dotenv').config()

const createChannel = (channelName) => {
  const config = {
    region: process.env.COCONUT_REGION,
    accessKeyId: process.env.IVS_ACCESS_KEY,
    secretAccessKey: process.env.IVS_SECRET_ACCESS_KEY,
  }
  AWS.config.update(config);
  const ivs = new AWS.IVS();

  console.log(channelName)

  const params = {
    authorized: false,
    latencyMode: "LOW",
    name: uuidv4(),
    recordingConfigurationArn: "arn:aws:ivs:eu-west-1:660273657420:recording-configuration/pNBW5rGanrbB",
    type: "STANDARD",
    name: channelName
  }

  return ivs.createChannel(params).promise()
}

const deleteChannel = (channelArn) => {
  const config = {
    region: process.env.COCONUT_REGION,
    accessKeyId: process.env.IVS_ACCESS_KEY,
    secretAccessKey: process.env.IVS_SECRET_ACCESS_KEY,
  }
  AWS.config.update(config);
  const ivs = new AWS.IVS();

  return ivs.deleteChannel({ arn: channelArn }).promise();
}

const getChannelByArn = (arn) => {
  const config = {
    region: process.env.COCONUT_REGION,
    accessKeyId: process.env.IVS_ACCESS_KEY,
    secretAccessKey: process.env.IVS_SECRET_ACCESS_KEY,
  }
  AWS.config.update(config);
  const ivs = new AWS.IVS();

  return ivs.getChannel({ arn }).promise()
}

const addInitialVideo = (params) => {
  console.log(params)
}

const addFullVideo = (params) => {
  console.log(params)
}

const parseUploaded = (time) => {
  console.log(time)
  return time.getUTCFullYear() + '-' +
  padZero(time.getUTCMonth() + 1) + '-' +
  padZero(time.getUTCDate()) + ' ' +
  padZero(time.getUTCHours()) + ':' +
  padZero(time.getUTCMinutes()) + ':' +
  padZero(time.getUTCSeconds());
}

const padZero = (num) => {
  return num < 10 ? '0' + num : num;
}

module.exports = { createChannel, deleteChannel, getChannelByArn, addInitialVideo, addFullVideo, parseUploaded }