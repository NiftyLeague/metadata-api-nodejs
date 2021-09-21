const { ethers } = require('hardhat');
const { utils } = require('web3');

// await sleep trick
// http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get Transaction Receipt given tx hash
 */
async function getTxReceipt(tx) {
  while (true) {
    let receipt = await ethers.provider.getTransactionReceipt(tx);
    if (receipt && receipt.logs) {
      console.log('TX RECEIPT', receipt);
      return receipt;
    }
    console.log('Waiting for mined block to include your trasaction...');
    await sleep(4000);
  }
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
