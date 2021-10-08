// npm i --save aws-sdk

const config = require('getconfig');
const AWS = require('aws-sdk');
var path = require('path');

const s3 = new AWS.S3({
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
});

const mimeTypes = {
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.json': 'application/json',
};

const uploadToS3 = async (
  fileName,
  content,
  retry = true,
  baseDirectory = config.s3.baseDirectory
) => {
  const params = {
    Bucket: config.s3.bucket,
    Key: `${baseDirectory}/${fileName}`,
    Body: content,
    ContentType: mimeTypes[path.extname(fileName)] || 'application/json',
    ACL: 'public-read',
  };
  try {
    return s3.upload(params).promise();
  } catch (err) {
    console.log(err);
    if (retry) return uploadToS3(fileName, content, false);
  }
};

module.exports = { uploadToS3 };
