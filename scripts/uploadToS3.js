// npm i --save aws-sdk

const config = require('getconfig');
const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
});

const uploadFile = (fileName, path, retry = true) => {
  const fileContent = fs.readFileSync(fileName);
  const params = {
    Bucket: config.s3.bucket,
    Key: `${config.s3.baseDirectory}/${path}/${fileName}`,
    Body: fileContent,
    ContentType: '<mime-type>', // "application/json" or "image/png" or "video/mp4"
    ACL: 'public-read',
  };

  s3.upload(params, function (err, data) {
    if (err) {
      if (retry) {
        // try one more time
        uploadFile(fileName, false);
      } else {
        console.log(err);
      }
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });
};

module.exports = { uploadFile };
