require('dotenv').config();
const config = require('getconfig');
const express = require('express');
const path = require('path');
const metadata = require('./metadata');

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
  const db = metadata[targetNetwork];
  const tokenId = parseInt(req.params.token_id).toString();
  const character = db[tokenId];
  const attributes = Object.entries(character).filter(
    ([k]) => k !== 'name' && k !== 'ipfs'
  );

  const data = {
    name: character.name
      ? character.name
      : `${character.Tribe} DEGEN #${tokenId}`,
    description: config.metadata.description,
    external_url: `${config.metadata.externalURL}/${tokenId}`,
    image: `${config.host}/images/${targetNetwork}/${tokenId}.${
      character.Rarity === 'Legendary' ? 'mp4' : 'png'
    }`,
    ipfs: character.ipfs,
    attributes: [
      { display_type: 'number', trait_type: 'Generation', value: 1 },
      ...attributes.map(([trait_type, value]) => ({ trait_type, value })),
    ],
  };
  res.send(data);
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});
