require('dotenv').config();
const config = require('getconfig');
const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.send('OpenSea API for the Nifty League!');
});

app.use(cors());

async function resolveMetadata(req) {
  const targetNetwork = req.params.network;
  const tokenId = parseInt(req.params.token_id).toString();
  const metadataURI = `https://nifty-league.s3.amazonaws.com/degens/${targetNetwork}/metadata/${tokenId}.json`;
  const response = await fetch(metadataURI);
  return response.json();
}

app.get('/:network/degen/:token_id', async function (req, res) {
  const metadata = await resolveMetadata(req);
  res.send(metadata);
});

app.get('/:network/degen/:token_id/rarity', async function (req, res) {
  const metadata = await resolveMetadata(req);
  const rarity = metadata.attributes?.find(a => a.trait_type === 'Rarity');
  if (rarity) res.send(rarity.value);
  else res.sendStatus(404);
});

app.post(
  `/:network/webhooks/degen/${config.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    console.log('WEBHOOK REQUEST', req);
    const transaction = await req.json();
    console.log('WEBHOOK transaction', transaction);
    res.sendStatus(200);
  }
);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
