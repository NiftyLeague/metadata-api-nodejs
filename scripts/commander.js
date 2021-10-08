#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

const { Command } = require('commander');
const chalk = require('chalk');
const CID = require('cids');
const config = require('getconfig');
const colorize = require('json-colorizer');
const path = require('path');
const { MakeMinty } = require('./minty');
const { alignOutput } = require('./utils');
const safeGenerateNFT = require('./safeGenerateNFT');
const { handleNameChangeById } = require('./handleNameChange');
const handleTraitCount = require('./handleTraitCount');
const { getTxReceipt } = require('./getTxReceipt');
const refreshOpenSea = require('./refreshOpenSea');
const getTokenHolders = require('./covalent');
const { combineSnapshotData, pinComic } = require('./comics');

const targetNetwork = config.hardhat.defaultNetwork;

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
    .command('create <token-id>')
    .description('"create" nft image and metadata')
    .action(createNFT);

  program
    .command('refresh')
    .description('"refresh" nft image and metadata')
    .action(refreshNFTs);

  program
    .command('rename <token-id>')
    .description('"rename" nft in metadata')
    .action(updateNFTName);

  program
    .command('update <token-id>')
    .description('"update" nft metadata')
    .action(updateNFT);

  program
    .command('token-holders')
    .description('"get" degen token-holders')
    .action(getTokenHolders);

  program
    .command('format-comics')
    .description('"format" degen token-holders snapshot data')
    .action(combineSnapshotData);

  program
    .command('pin-comic <token-id>')
    .description('"pin" degen comics metadata')
    .action(pinComics);

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

  program
    .command('receipt <tx>')
    .description('"tx" transaction hash to lookup')
    .action(getTxReceipt);

  // The hardhat and getconfig modules both expect to be running from the root directory of the project,
  // so we change the current directory to the parent dir of this script file to make things work
  // even if you call minty from elsewhere
  const rootDir = path.join(__dirname, '..');
  process.chdir(rootDir);

  await program.parseAsync(process.argv);
}

// ---- command action functions

async function createNFT(tokenId) {
  await safeGenerateNFT(targetNetwork, tokenId);
}

async function refreshNFTs() {
  for (let i = 1; i <= 9900; i++) {
    await refreshOpenSea(targetNetwork, i);
  }
}

async function updateNFTName(tokenId) {
  await handleNameChangeById(targetNetwork, tokenId);
}

async function updateNFT(tokenId) {
  for (let i = 1; i <= 9900; i++) {
    await handleTraitCount(targetNetwork, i);
  }
  // await handleTraitCount(targetNetwork, tokenId);
}

async function getNFT(tokenId, options) {
  const { creationInfo: fetchCreationInfo } = options;
  const minty = await MakeMinty(targetNetwork);
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

async function pinComics(tokenID) {
  await pinComic(targetNetwork, tokenID);
  // for (let i = 1; i <= 4; i++) {
  //   await pinComic(targetNetwork, i);
  // }
}

async function pinNFTData(tokenId) {
  const minty = await MakeMinty(targetNetwork);
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
  const minty = await MakeMinty(targetNetwork);
  await minty.unpin(new CID(cid));
  console.log(`✅ Unpinned all data for CID ${chalk.yellow(cid)}`);
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
