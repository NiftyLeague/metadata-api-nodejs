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

async function handleNameChangeById(targetNetwork, tokenId) {
  const minty = await MakeMinty(targetNetwork);
  const { exists, metadata } = await minty.checkTokenMetadataExists(tokenId);
  if (exists) {
    console.log(`Updating Metadata for token id ${tokenId}:`);
    const { newMetadata } = await minty.updateTokenName(tokenId, metadata);
    console.log('');
    console.log('Updated NFT Metadata:');
    console.log(colorize(JSON.stringify(newMetadata), colorizeOptions));
    return { metadata: newMetadata };
  }
}

async function getIdFromInput(input) {
  const abi = JSON.parse(
    fs.readFileSync(`./contracts/${config.hardhat.nftContractName}.abi.json`, {
      encoding: 'utf8',
    })
  );
  const iface = new ethers.utils.Interface(abi);
  const inputData = await iface.decodeFunctionData('changeName', input);
  const tokenId = inputData[0].toNumber();
  return tokenId;
}

async function handleNameChangeByInput(targetNetwork, input) {
  const tokenId = await getIdFromInput(input);
  return handleNameChangeById(targetNetwork, tokenId);
}

module.exports = {
  handleNameChangeByInput,
  handleNameChangeById,
};
