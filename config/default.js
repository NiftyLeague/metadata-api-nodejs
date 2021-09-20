const config = {
  host: 'https://api.nifty-league.com',
  webhookSecret: '$$WEBHOOK_SECRET',

  hardhat: {
    defaultNetwork: '$$HARDHAT_NETWORK',
    infura: '$$INFURA_PROJECT_ID',
    nftContractName: 'NiftyDegen',
  },

  metadata: {
    description: 'Original collection of your favorite 10k DEGENs 🎮',
    externalURL: 'https://nifty-league.com/degens',
  },

  imageGenerator: {
    baseURL: '$$UNITY_IMAGE_GENERATOR_BASE_URL',
    secret: '$$UNITY_IMAGE_GENERATOR_SECRET',
    version: '$$UNITY_IMAGE_GENERATOR_VERSION',
  },

  s3: {
    accessKeyId: '$$S3_ACCESS_ID',
    secretAccessKey: '$$S3_SECRET',
    bucket: 'nifty-league',
    baseDirectory: 'degens',
  },

  ipfs: {
    baseDirName: 'nifty-degens',
    authorizationDEV: '$$INFURA_AUTHORIZATION_DEV',
    authorizationPROD: '$$INFURA_AUTHORIZATION_PROD',
    // Can use http for local IPFS node
    protocol: 'https',
    // For local IPFS nodes you can set this to http://localhost:5001
    host: 'ipfs.infura.io',
    // If you're running IPFS on a non-default port, update this URL. If you're using the IPFS defaults, you should be all set.
    port: '5001',
    // This default it already set by ipfs-http-client but can be updated if necessary
    path: 'api/v0',
    // If you're running the local IPFS gateway on a non-default port, or if you want to use a public gatway when displaying IPFS gateway urls, edit this.
    gatewayURL: 'https://gateway.ipfs.io/ipfs',
  },
};

module.exports = config;
