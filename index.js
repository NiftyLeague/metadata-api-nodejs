require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

// Static public files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.send('OpenSea API for the Nifty League!');
});

app.get('/api/:network/degen/:token_id', function (req, res) {
  const targetNetwork = req.params.network;
  const tokenId = parseInt(req.params.token_id).toString();
  const metadataPath = `./metadata/${targetNetwork}/${tokenId}.json`;
  const metadata = fs.existsSync(metadataPath)
    ? JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf8' }))
    : {};
  res.send(metadata);
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
