const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.COCONUT_REGION,
  accessKeyId: process.env.COCONUT_ACCESS_KEY,
  secretAccessKey: process.env.COCONUT_SECRET_ACCESS_KEY,
});

const ses = new AWS.SES({apiVersion: '2010-12-01'});
const S3 = new AWS.S3();

const listByKey = key => {
  const params = {
    Bucket: process.env.COCONUT_BUCKET,
    Prefix: key + '/',
    Delimiter: '/'
  }

  return S3.listObjectsV2(params).promise()
}

const deleteByFolder = async key => {
  const { Contents } = await listByKey(key)

  if(!Contents) throw new Error('content not found')

  const promises = Contents.map(e => {
    return S3.deleteObject({
      Bucket: process.env.COCONUT_BUCKET,
      Key: e.Key
    }).promise()
  })

  return Promise.all(promises)
}

module.exports = { deleteByFolder, ses }