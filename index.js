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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resolveCirculatingSupply(req) {
  try {
    const secret = process.env.ETHERSCAN_API_KEY;
    const contractaddress = '0x3c8d2fce49906e11e71cb16fa0ffeb2b16c29638';
    const supplyURI = `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractaddress}&apikey=${secret}`;
    const supplyRes = await fetch(supplyURI);
    await sleep(5000);
    const timelockaddress = '0xfeb2f45a3817ef9156a6c771ffc90098d3dfe003';
    const timelockURI = `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${contractaddress}&address=${timelockaddress}&tag=latest&apikey=${secret}`;
    const lockedRes = await fetch(timelockURI);
    if (supplyRes.status < 400 && lockedRes.status < 400) {
      const { result: supply } = await supplyRes.json();
      const { result: locked } = await lockedRes.json();
      return BigInt(supply) - BigInt(locked);
    }
    return null;
  } catch (e) {
    return null;
  }
}

app.get('/NFTL/supply', async function (req, res) {
  const supply = await resolveCirculatingSupply(req);
  console.log('supply', supply, supply.toString());
  if (supply) res.send(supply.toString());
  else res.sendStatus(404);
});

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

async function resolveComicsMetadata(req) {
  try {
    const tokenId = parseInt(req.params.token_id, 16).toString();
    const metadataURI = `https://nifty-league.s3.amazonaws.com/launch-comics/metadata/${tokenId}.json`;
    const response = await fetch(metadataURI);
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

app.get('/:network/launch-comics/:token_id', async function (req, res) {
  const metadata = await resolveComicsMetadata(req, false);
  if (metadata) res.send(metadata);
  else res.sendStatus(404);
});

app.post(
  `/:network/webhooks/degen/${config.blocknative.webhookSecret}`,
  async function (req, res) {
    const targetNetwork = req.params.network;
    const tx = req.body;
    if (
      targetNetwork === 'mainnet' &&
      tx.status === 'confirmed' &&
      tx.direction === 'incoming' &&
      tx.apiKey === config.blocknative.apiKey.degens
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
