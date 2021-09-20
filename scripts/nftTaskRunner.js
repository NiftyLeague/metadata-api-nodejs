/* eslint-disable no-use-before-define, no-await-in-loop */
const fs = require('fs');
const config = require('getconfig');
const chalk = require('chalk');
const colorize = require('json-colorizer');
const { MakeMinty } = require('./minty');

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

async function main() {
  const targetNetwork = config.hardhat.defaultNetwork;

  const imagesDir = `./public/images/${targetNetwork}`;
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
  const metadataDir = `./metadata/${targetNetwork}`;
  if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir);

  const minty = await MakeMinty();
  // const tokenIds = [1, 2, 3, 4, 5, 6];
  const tokenIds = [6];
  for (const tokenId of tokenIds) {
    await safeGenerateNFT(minty, tokenId);
  }
}

async function safeGenerateNFT(minty, tokenId) {
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

async function getNFT(minty, tokenId, options = {}) {
  const nft = await minty.getNFT(tokenId, options);

  const output = [
    ['Token ID:', chalk.green(nft.tokenId)],
    ['Owner Address:', chalk.yellow(nft.ownerAddress)],
  ];
  if (nft.creationInfo) {
    output.push([
      'Creator Address:',
      chalk.yellow(nft.creationInfo.creatorAddress),
    ]);
    output.push(['Block Number:', nft.creationInfo.blockNumber]);
  }
  output.push(['Metadata Address:', chalk.blue(nft.metadataURI)]);
  output.push(['Metadata Gateway URL:', chalk.blue(nft.metadataGatewayURL)]);
  output.push(['Asset Address:', chalk.blue(nft.assetURI)]);
  output.push(['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL)]);
  alignOutput(output);

  console.log('NFT Metadata:');
  console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions));
}

function alignOutput(labelValuePairs) {
  const maxLabelLength = labelValuePairs
    .map(([l]) => l.length)
    .reduce((len, max) => (len > max ? len : max));
  // eslint-disable-next-line no-restricted-syntax
  for (const [label, value] of labelValuePairs) {
    console.log(label.padEnd(maxLabelLength + 1), value);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
