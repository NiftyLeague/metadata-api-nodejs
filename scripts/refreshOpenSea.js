const config = require('getconfig');
const fs = require('fs');
const fetch = require('node-fetch');

async function refreshOpenSea(
  targetNetwork,
  tokenId,
  contractName = config.hardhat.nftContractName
) {
  const addressPath = `./contracts/${contractName}.${targetNetwork}.address`;
  const address = fs.readFileSync(addressPath).toString();
  const baseURL = `https://${
    targetNetwork === 'goerli' ? 'testnets-' : ''
  }api.opensea.io/api/v1/asset`;
  const openseaUpdateApi = `${baseURL}/${address}/${tokenId}/?force_update=true`;
  console.log(`Refreshing OpenSea data for tokenID:`, tokenId);
  const response = await fetch(openseaUpdateApi);
  if (response.status < 400) return response.json();
  return null;
}

module.exports = refreshOpenSea;
