require('dotenv').config();
const config = require('getconfig');
const cors = require('cors');
const express = require('express');
var bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const safeGenerateNFT = require('./scripts/safeGenerateNFT');
const { handleNameChangeByInput } = require('./scripts/handleNameChange');
const { getTokenIdFromTxReceipt } = require('./scripts/getTxReceipt');
const { CONTRACT_METHODS } = require('./constants');

const PORT = process.env.PORT || 5000;

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.send('OpenSea API for the Nifty League!');
});

app.use(bodyParser.json());

app.use(cors());

async function resolveMetadata(req) {
  try {
    const targetNetwork = req.params.network;
    const tokenId = parseInt(req.params.token_id).toString();
    const metadataURI = `https://nifty-league.s3.amazonaws.com/degens/${targetNetwork}/metadata/${tokenId}.json`;
    const response = await fetch(metadataURI);
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

app.get('/:network/degen/:token_id', async function (req, res) {
  const metadata = await resolveMetadata(req);
  if (metadata) res.send(metadata);
  else res.sendStatus(404);
});

app.get('/:network/degen/:token_id/background', async function (req, res) {
  const metadata = await resolveMetadata(req);
  const background = metadata?.attributes?.find(
    a => a.trait_type === 'Background'
  );
  if (background) res.send(background.value);
  else res.sendStatus(404);
});

app.get('/:network/degen/:token_id/rarity', async function (req, res) {
  const metadata = await resolveMetadata(req);
  const rarity = metadata?.attributes?.find(a => a.trait_type === 'Rarity');
  if (rarity) res.send(rarity.value);
  else res.sendStatus(404);
});

app.post(
  `/:network/webhooks/degen/${config.blocknative.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    const tx = req.body;
    if (
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.blocknative.apiKey[targetNetwork]
    ) {
      console.log('WEBHOOK TX:', tx);
      if (tx.input.startsWith(CONTRACT_METHODS.PURCHASE)) {
        const tokenId = await getTokenIdFromTxReceipt(tx.hash);
        await safeGenerateNFT(targetNetwork, tokenId);
      }
      if (tx.input.startsWith(CONTRACT_METHODS.RENAME)) {
        await getTokenIdFromTxReceipt(tx.hash);
        await handleNameChangeByInput(targetNetwork, tx.input);
      }
    }
    res.sendStatus(200);
  }
);

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
