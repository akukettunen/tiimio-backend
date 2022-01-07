const companion = require('@uppy/companion')
const { v4: uuidv4 } = require('uuid');

const options = {
  providerOptions: {
    s3: {
      getKey: (req, filename, metadata) => uuidv4(),
      key: process.env.COMPANION_AWS_KEY,
      secret: process.env.COMPANION_SECRET_ACCESS_KEY,
      bucket: 'tiiimio-dev-videos',
      region: 'eu-west-1',
      useAccelerateEndpoint: false, // default: false,
      expires: 3600, // default: 300 (5 minutes)
      acl: 'private', // default: public-read
    },
  },
  server: {
    host: 'localhost:4040',
    protocol: 'http',
    // This MUST match the path you specify in `app.use()` below:
    path: '/companion',
  },
  filePath: './',
  "secret": process.env.COMPANION_SECRET
}

module.exports = companion.app(options)