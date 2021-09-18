const config = {
  host: 'https://nifty-league.herokuapp.com',

  hardhat: {
    defaultNetwork: '$$HARDHAT_NETWORK',
    infura: '$$INFURA_PROJECT_ID',
    nftContractName: 'NiftyDegen',
  },

  metadata: {
    description:
      'Collection of 10000 self-composable Nifty League DEGENs on the Ethereum blockchain',
    externalURL: 'https://nifty-league.com/degens',
  },

  imageGenerator: {
    avoidImageOverride: '$$AVOID_IMAGE_OVERRIDE',
    baseURL: '$$UNITY_IMAGE_GENERATOR_BASE_URL',
    secret: '$$UNITY_IMAGE_GENERATOR_SECRET',
    version: '$$UNITY_IMAGE_GENERATOR_VERSION',
  },

  ipfs: {
    ipfsBaseDirName: 'nifty-degens',
    // The pinningService config tells minty what remote pinning service to use for pinning the IPFS data for a token.
    // The values are read in from environment variables, to discourage checking credentials into source control.
    // You can make things easy by creating a .env file with your environment variable definitions. See the example files
    // pinata.env.example and nft.storage.env.example in this directory for templates you can use to get up and running.
    pinningService: {
      name: '$$PINNING_SERVICE_NAME',
      endpoint: '$$PINNING_SERVICE_ENDPOINT',
      key: '$$PINNING_SERVICE_KEY',
    },
    // If you're running IPFS on a non-default port, update this URL. If you're using the IPFS defaults, you should be all set.
    ipfsApiURL: 'http://localhost:5001',
    // If you're running the local IPFS gateway on a non-default port, or if you want to use a public gatway when displaying IPFS gateway urls, edit this.
    host: '$$IPFS_HOST',
    ipfsGatewayURL: 'https://${self.host}/ipfs',
    ipnsGatewayURL: 'https://${self.host}/ipns',
  },
};

module.exports = config;
