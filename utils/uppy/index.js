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
    path: '/companion',
  },
  debug: false,
  metrics: false,
  filePath: './',
  streamingUpload: true,
  uploadUrls: ['^https:\/\/api\.tiimi\.io(\/.*)?$'],
  secret: process.env.COMPANION_SECRET
}

const options_image = {
  providerOptions: {
    s3: {
      getKey: (req, filename, metadata) =>{
        let uuid = uuidv4()
        return  uuid + '/' + uuid
      },
      key: process.env.COCONUT_ACCESS_KEY,
      secret: process.env.COCONUT_SECRET_ACCESS_KEY,
      bucket: 'tiimio-assets',
      region: 'eu-west-1',
      useAccelerateEndpoint: true, // default: false,
      expires: 3600, // default: 300 (5 minutes)
      acl: 'private', // default: public-read
    },
  },
  server: {
    host: process.env.URL_BASE,
    protocol: 'http',
    path: '/companion-graphics',
  },
  debug: false,
  metrics: false,
  filePath: './',
  streamingUpload: true,
  uploadUrls: ['^https:\/\/api\.tiimi\.io(\/.*)?$'],
  secret: process.env.COMPANION_SECRET
}

module.exports = {
  comp: companion.app(options),
  // comp_graphics: companion_graphics.app(options_image),
  instance: companion
}