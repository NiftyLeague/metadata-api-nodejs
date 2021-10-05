const colorize = require('json-colorizer');
const config = require('getconfig');
const fs = require('fs');
const { ethers } = require('hardhat');
const { MakeMinty } = require('./minty');

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

async function handleTraitCount(targetNetwork, tokenId) {
  const minty = await MakeMinty(targetNetwork);
  const { exists, metadata } = await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Updating Metadata for token id ${tokenId}:`);
    const { newMetadata } = await minty.updateTokenTraitCount(
      tokenId,
      metadata
    );
    console.log('');
    console.log('Updated NFT Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), colorizeOptions));
    return { metadata: newMetadata };
  }
}

module.exports = handleTraitCount;
