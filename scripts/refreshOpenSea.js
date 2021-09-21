const config = require('getconfig');

async function refreshOpenSea(targetNetwork, tokenId) {
  try {
    const contractName = config.hardhat.nftContractName;
    const addressPath = `./contracts/${contractName}.${targetNetwork}.address`;
    const address = fs.readFileSync(addressPath).toString();
    const baseURL = `https://${
      targetNetwork === 'rinkeby' ? 'testnets-' : ''
    }api.opensea.io/api/v1/asset`;
    const openseaUpdateApi = `${baseURL}/${address}/${tokenId}/?force_update=true`;
    const response = await fetch(openseaUpdateApi);
    if (response.status < 400) return response.json();
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = refreshOpenSea;
