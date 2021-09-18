require('dotenv').config();
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.use(cors());

// Static public files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.send('OpenSea API for the Nifty League!');
});

function resolveMetadata(req) {
  const targetNetwork = req.params.network;
  const tokenId = parseInt(req.params.token_id).toString();
  const metadataPath = `./metadata/${targetNetwork}/${tokenId}.json`;
  return fs.existsSync(metadataPath)
    ? JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf8' }))
    : {};
}

app.get('/:network/degen/:token_id', function (req, res) {
  const metadata = resolveMetadata(req);
  res.send(metadata);
});

app.get('/:network/degen/:token_id/rarity', function (req, res) {
  const metadata = resolveMetadata(req);
  const rarity = metadata.attributes?.find(a => a.trait_type === 'Rarity');
  if (rarity) res.send(rarity.value);
  else res.sendStatus(404);
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
