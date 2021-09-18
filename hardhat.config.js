require('dotenv').config();
require('@typechain/hardhat');
const config = require('getconfig');

module.exports = {
  defaultNetwork: config.hardhat.defaultNetwork,
  networks: {
    mainnet: { url: `https://mainnet.infura.io/v3/${config.hardhat.infura}` },
    rinkeby: { url: `https://rinkeby.infura.io/v3/${config.hardhat.infura}` },
  },
  // solidity: {
  //   compilers: [
  //     {
  //       version: '0.8.4',
  //       settings: { optimizer: { enabled: true, runs: 1000 } },
  //     },
  //   ],
  // },
  // paths: {
  //   sources: './contracts',
  //   tests: './test',
  //   cache: `./cache/${defaultNetwork}`,
  //   artifacts: `./artifacts/${defaultNetwork}`,
  // },
};
