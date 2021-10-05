const config = require('getconfig');
const fs = require('fs');
const fetch = require('node-fetch');
const colorize = require('json-colorizer');

const colorizeOptions = {
  pretty: true,
  colors: {
    STRING_KEY: 'blue.bold',
    STRING_LITERAL: 'green',
  },
};

const CHAIN_ID = 1;
const CONTRACT_NAME = config.hardhat.nftContractName;
const TARGET_NETWORK = config.hardhat.defaultNetwork;
const ADDRESS_PATH = `./contracts/${CONTRACT_NAME}.${TARGET_NETWORK}.address`;
const ADDRESS = fs.readFileSync(ADDRESS_PATH).toString();
const BASE_URL = `https://api.covalenthq.com/v1/${CHAIN_ID}`;
const API_KEY = config.covalent;

async function getTokenHolders() {
  const tokeHoldersApi = `${BASE_URL}/tokens/${ADDRESS}/token_holders/?page-size=5000&key=${API_KEY}`;
  const response = await fetch(tokeHoldersApi);
  if (response.status < 400) return response.json();
  return null;
}

async function getNFTTokenIDs() {
  const tokeHoldersApi = `${BASE_URL}/tokens/${ADDRESS}/nft_token_ids/?page-size=5000&key=${API_KEY}`;
  const response = await fetch(tokeHoldersApi);
  if (response.status < 400) return response.json();
  return null;
}

async function getTokenBalances(address) {
  const tokeHoldersApi = `${BASE_URL}/address/${address}/balances_v2/?nft=true&no-nft-fetch=true&key=${API_KEY}`;
  const response = await fetch(tokeHoldersApi);
  if (response.status < 400) return response.json();
  return null;
}

async function parseCovalentTokenData() {
  const res = await getTokenHolders();
  return res?.data?.items;
}

async function getDegenHoldings(address) {
  const res = await getTokenBalances(address);
  return (
    res?.data?.items?.find(item => item.contract_name === CONTRACT_NAME)
      ?.nft_data || []
  );
}

async function calcNFTLAirdrop(address) {
  const holdings = await getDegenHoldings(address);
  let nftlClaimable = 0;
  holdings.forEach(token => {
    const tokenID = parseInt(token.token_id, 10);
    if (tokenID > 9500) nftlClaimable += 0;
    else if (tokenID > 8500) nftlClaimable += 6500;
    else if (tokenID > 6500) nftlClaimable += 11500;
    else if (tokenID > 4500) nftlClaimable += 13500;
    else if (tokenID > 2500) nftlClaimable += 15500;
    else if (tokenID > 1000) nftlClaimable += 17500;
    else nftlClaimable += 19500;
  });
  return nftlClaimable;
}

async function convertTokenHolderData() {
  const tokenHolders = await parseCovalentTokenData();
  const merkleData = {};
  for (holder of tokenHolders) {
    merkleData[holder.address] =
      (await calcNFTLAirdrop(holder.address)) + '000000000000000000';
  }
  console.log('Token Holders:');
  console.log(colorize(JSON.stringify(merkleData), colorizeOptions));
  return merkleData;
}

module.exports = convertTokenHolderData;
