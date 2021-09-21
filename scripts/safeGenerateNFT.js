const fs = require('fs');
const chalk = require('chalk');
const colorize = require('json-colorizer');
const { MakeMinty } = require('./minty');
const { alignOutput } = require('./utils');

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

async function safeGenerateNFT(network, tokenId) {
  const imagesDir = `./public/images/${network}`;
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

  const minty = await MakeMinty();
  const { exists, metadata, metadataURI } =
    await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Metadata already exists for token id ${tokenId}`);
    return { metadata, metadataURI };
  } else {
    console.log(`Generating asset and metadata for token id ${tokenId}:`);
    const nft = await minty.generateNFT(tokenId);
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
}

module.exports = safeGenerateNFT;
