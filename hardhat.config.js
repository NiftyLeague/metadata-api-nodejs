require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
const config = require('getconfig');

module.exports = {
  defaultNetwork: config.hardhat.defaultNetwork,
  solidity: '0.8.4',
  networks: {
    mainnet: { url: `https://mainnet.infura.io/v3/${config.hardhat.infura}` },
    rinkeby: { url: `https://rinkeby.infura.io/v3/${config.hardhat.infura}` },
  },
};
