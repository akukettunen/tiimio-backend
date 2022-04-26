const companion = require('@uppy/companion')
const { v4: uuidv4 } = require('uuid');

const options = {
  providerOptions: {
    s3: {
      getKey: (req, filename, metadata) =>{
        let uuid = uuidv4()
        return  uuid + '/' + uuid
      },
      key: process.env.COCONUT_ACCESS_KEY,
      secret: process.env.COCONUT_SECRET_ACCESS_KEY,
      bucket: process.env.COCONUT_BUCKET,
      region: 'eu-west-1',
      useAccelerateEndpoint: true, // default: false,
      expires: 3600, // default: 300 (5 minutes)
      acl: 'private', // default: public-read
    },
  },
  server: {
    host: process.env.URL_BASE,
    protocol: 'http',
    // This MUST match the path you specify in `app.use()` below:
    path: '/companion',
  },
  sendSelfEndpoint: process.env.URL_BASE + '/companion',
  filePath: './files',
  streamingUpload: true,
  secret: process.env.COMPANION_SECRET
}

module.exports = companion.app(options)