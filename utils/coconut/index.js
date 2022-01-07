require('dotenv').config()
const { ConnectContactLens } = require('aws-sdk');
const Coconut = require('coconutjs');

const coconut = new Coconut.Client(process.env.COCONUT_API_KEY);
// const coconut = new Coconut.Client('k-380e5006bce331aec2e640f3ec6083b6');

coconut['region'] = process.env.COCONUT_REGION

coconut.storage = {
  'service': 's3',
  'bucket': process.env.COCONUT_BUCKET,
  // 'bucket': 'tiimio-dev-nortg',
  'region': process.env.COCONUT_REGION,
  // 'region': 'us-east-1',
  'credentials': {
    'access_key_id': process.env.COMPANION_AWS_KEY,
    'secret_access_key': process.env.COMPANION_SECRET_ACCESS_KEY
  }
}

const createJob = params => {
  return new Promise((resolve, reject) => {
    coconut.Job.create(params, (job, err) => {
      if(err) {
        reject(err)
      } else {
        resolve(job)
      }
    })
  })
}

module.exports = { coconut, createJob };
