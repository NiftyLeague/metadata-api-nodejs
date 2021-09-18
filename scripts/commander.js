#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

const { Command } = require('commander');
const chalk = require('chalk');
const CID = require('cids');
const colorize = require('json-colorizer');
const path = require('path');
const { MakeMinty } = require('./minty');

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

async function main() {
  const program = new Command();

  program
    .command('get <token-id>')
    .description('get info about an NFT using its token ID')
    .option(
      '-c, --creation-info',
      'include the creator address and block number the NFT was minted'
    )
    .action(getNFT);

  program
    .command('pin <token-id>')
    .description('"pin" the data for an NFT to a remote IPFS Pinning Service')
    .action(pinNFTData);

  program
    .command('unpin <cid>')
    .description('"unpin" any CID in your remote IPFS Pinning Service')
    .action(unpinCID);

  // The hardhat and getconfig modules both expect to be running from the root directory of the project,
  // so we change the current directory to the parent dir of this script file to make things work
  // even if you call minty from elsewhere
  const rootDir = path.join(__dirname, '..');
  process.chdir(rootDir);

  await program.parseAsync(process.argv);
}

// ---- command action functions

async function getNFT(tokenId, options) {
  const { creationInfo: fetchCreationInfo } = options;
  const minty = await MakeMinty();
  const nft = await minty.getNFT(tokenId, { fetchCreationInfo });

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

async function pinNFTData(tokenId) {
  const minty = await MakeMinty();
  const { metadata, metadataURI } = await minty.getNFT(tokenId, {});
  const { pinnedMetadataCID } = await minty.pinTokenData(
    tokenId,
    metadata,
    metadataURI
  );
  console.log(
    `🌿 Pinned all data for token id ${chalk.green(
      tokenId
    )} to CID(${pinnedMetadataCID})`
  );
}

async function unpinCID(cid) {
  const minty = await MakeMinty();
  await minty.unpin(new CID(cid));
  console.log(`✅ Unpinned all data for CID ${chalk.yellow(cid)}`);
}

// ---- helpers

function alignOutput(labelValuePairs) {
  const maxLabelLength = labelValuePairs
    .map(([l, _]) => l.length)
    .reduce((len, max) => (len > max ? len : max));
  for (const [label, value] of labelValuePairs) {
    console.log(label.padEnd(maxLabelLength + 1), value);
  }
}

// ---- main entry point when running as a script

// make sure we catch all errors
main()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
