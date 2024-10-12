const { user, is_in_team, tiimi_admin } = require('../middleware/authMiddleware');
const express = require('express');
      AWS = require('aws-sdk');
      router = express.Router();
require('express-async-errors');

// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: process.env.COCONUT_ACCESS_KEY,
  secretAccessKey: process.env.COCONUT_SECRET_ACCESS_KEY,
  region: process.env.COCONUT_REGION,
});

const s3 = new AWS.S3();

router.post('/get-presigned-url', tiimi_admin, async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType || !folder) {
      return res.status(400).json({ error: 'Missing fileName or fileType' });
    }

    const Key = `${folder}/${Date.now()}_${fileName}` // The S3 key (file name in S3)
    const Bucket = process.env.CLIP_AWS_S3_BUCKET
    const URL = encodeURI(`https://${Bucket}.s3.${process.env.COCONUT_REGION}.amazonaws.com/${Key}`)

    // Define the S3 parameters for the presigned URL
    const params = {
      Bucket, // Your S3 bucket name
      Key,
      ContentType: fileType, // The file's content type (e.g., image/jpeg)
      Expires: 60 * 5, // URL expiration time in seconds (e.g., 5 minutes)
    };

    // Generate the presigned URL
    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);

    // Return the presigned URL to the client
    res.json({ url: presignedUrl, fileUrl: URL });
  } catch (error) {
    console.error('Error generating presigned URL', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

module.exports = router;
