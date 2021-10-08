const fs = require('fs');
const chalk = require('chalk');
const colorize = require('json-colorizer');
const { MakeMinty } = require('./minty');
const { alignOutput } = require('./utils');

const config = require('getconfig');

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

const p1 = JSON.parse(fs.readFileSync('data/p1.json', { encoding: 'utf8' }));
const p2 = JSON.parse(fs.readFileSync('data/p2.json', { encoding: 'utf8' }));
const p3 = JSON.parse(fs.readFileSync('data/p3.json', { encoding: 'utf8' }));
const p4 = JSON.parse(fs.readFileSync('data/p4.json', { encoding: 'utf8' }));

function combineSnapshotData() {
  const comics = {};
  p1.forEach(holder => {
    comics[holder.address] = {};
    comics[holder.address].p1 = holder.balance;
  });
  p2.forEach(holder => {
    if (!comics[holder.address]) comics[holder.address] = {};
    comics[holder.address].p2 = holder.balance;
  });
  p3.forEach(holder => {
    if (!comics[holder.address]) comics[holder.address] = {};
    comics[holder.address].p3 = holder.balance;
  });
  p4.forEach(holder => {
    if (!comics[holder.address]) comics[holder.address] = {};
    comics[holder.address].p4 = holder.balance;
  });
  fs.writeFileSync(`data/comics.json`, JSON.stringify(comics, null, 2));
}

async function pinComic(targetNetwork, tokenId) {
  const minty = await MakeMinty(
    targetNetwork,
    config.hardhat.comicsContractName
  );
  console.log(`Generating asset and metadata for comic id ${tokenId}:`);
  const nft = await minty.generateComic(tokenId);
  console.log('');
  alignOutput([
    ['Token ID:', chalk.green(nft.tokenId)],
    ['Asset Address:', chalk.blue(nft.assetURI)],
    ['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL)],
  ]);
  console.log('NFT Metadata:');
  console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions));
  return { metadata: nft.metadata, metadataURI: nft.metadataURI };
}

module.exports = { combineSnapshotData, pinComic };
