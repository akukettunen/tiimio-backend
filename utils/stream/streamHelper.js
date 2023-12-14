const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
require('dotenv').config()

const createChannel = () => {
  const config = {
    region: process.env.COCONUT_REGION,
    accessKeyId: process.env.IVS_ACCESS_KEY,
    secretAccessKey: process.env.IVS_SECRET_ACCESS_KEY,
  }
  AWS.config.update(config);
  const ivs = new AWS.IVS();

  const params = {
    authorized: false,
    latencyMode: "LOW",
    name: uuidv4(),
    recordingConfigurationArn: "arn:aws:ivs:eu-west-1:660273657420:recording-configuration/pNBW5rGanrbB",
    type: "STANDARD"
  }

  return ivs.createChannel(params).promise()
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

module.exports = { createChannel, getChannelByArn }