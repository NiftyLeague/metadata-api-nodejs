const { ethers } = require('hardhat');
const fs = require('fs');
const config = require('getconfig');

/**
 * Get NFT contract initialized with ABI & target address
 */
async function getContractFactory(targetNetwork, contractName) {
  const abi = JSON.parse(
    fs.readFileSync(`./contracts/${contractName}.abi.json`, {
      encoding: 'utf8',
    })
  );
  const addressPath = `./contracts/${contractName}.${targetNetwork}.address`;
  const address = fs.readFileSync(addressPath).toString();
  const contract = await ethers.getContractAt(abi, address);
  await contract.deployed();
  return contract;
}

module.exports = getContractFactory;
