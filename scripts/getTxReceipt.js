const { ethers } = require('hardhat');
const { utils } = require('web3');

/**
 * Get Transaction Receipt given tx hash
 */
async function getTxReceipt(tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx);
  console.log('TX RECEIPT', receipt);
  return receipt;
}

/**
 * Get NFT Token ID given tx hash
 */
async function getTokenIdFromTxReceipt(tx) {
  const receipt = await getTxReceipt(tx);
  const topics = receipt.logs[0].topics;
  return utils.hexToNumber(topics[3]);
}

module.exports = { getTxReceipt, getTokenIdFromTxReceipt };
