const all = require('it-all');
const chalk = require('chalk');
const CID = require('cids');
const fetch = require('node-fetch');
const fs = require('fs');
const ipfsClient = require('ipfs-http-client');
const path = require('path');
const uint8ArrayConcat = require('uint8arrays/concat');
const uint8ArrayToString = require('uint8arrays/to-string');

// The getconfig package loads configuration from files located in the the `config` directory.
// See https://www.npmjs.com/package/getconfig for info on how to override the default config for
// different environments (e.g. testnet, mainnet, staging, production, etc).
const config = require('getconfig');

const {
  stripIpfsUriPrefix,
  ensureIpfsUriPrefix,
  makeGatewayURL,
  extractCID,
} = require('./uriHelpers');
const {
  raritySelector,
  generateImageURL,
  downloadImage,
} = require('./imageGenerator');
const getContractFactory = require('./getContractFactory');
const { uploadToS3 } = require('./uploadToS3');
const {
  CHARACTER_RARITIES,
  CHARACTER_TRAIT_TYPES,
  TRAIT_VALUE_MAP,
} = require('../constants');

// ipfs parameters for more deterministic CIDs
const ipfsOptions = {
  cidVersion: 1,
  hashAlg: 'sha2-256',
  wrapWithDirectory: true,
};

/**
 * Construct and asynchronously initialize a new Minty instance.
 * @returns {Promise<Minty>} a new instance of Minty, ready to mint NFTs.
 */
async function MakeMinty() {
  const m = new Minty();
  await m.init();
  return m;
}

/**
 * Minty is the main object responsible for storing NFT data and interacting with the smart contract.
 * Before constructing, make sure that the contract has been deployed
 *
 * Minty requires async initialization, so the Minty class (and its constructor) are not exported.
 * To make one, use the async {@link MakeMinty} function.
 */
class Minty {
  constructor() {
    this._initialized = false;
    this.contract = null;
    this.ipfs = null;
  }

  async init() {
    if (this._initialized) return;

    this.targetNetwork = config.hardhat.defaultNetwork;
    // connect to the smart contract using the address and ABI
    this.contract = await getContractFactory();

    // create a local IPFS node
    this.ipfs = ipfsClient.create({
      protocol: config.ipfs.protocol,
      host: config.ipfs.host,
      port: config.ipfs.port,
      path: config.ipfs.path,
      headers: {
        authorization: `Basic ${
          this.targetNetwork === 'mainnet'
            ? config.ipfs.authorizationPROD
            : config.ipfs.authorizationDEV
        }`,
      },
    });

    this._initialized = true;
  }

  //////////////////////////////////////////////
  // ------ NFT Generation
  //////////////////////////////////////////////

  /**
   * Adds NFT metadata and image to IPFS given asset data.
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {[]} traits - list of character traits from contract
   * @param {string} filepath - token image filepath
   * @param {Buffer|Uint8Array} content - a Buffer or UInt8Array of data (e.g. for an image)
   * @param {number} rarity - number of background rarity 0-3
   *
   * @typedef {object} GenerateNFTResult
   * @property {string} tokenId - the unique ID of the new token
   * @property {object} metadata - the JSON metadata stored in IPFS and referenced by the token's metadata URI
   * @property {string} assetURI - an ipfs:// URI for the NFT asset
   * @property {string} assetGatewayURL - an HTTP gateway URL for the NFT asset
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async uploadNFTFromAssetData(tokenId, traits, filePath, content, rarity) {
    const basename = path.basename(filePath);

    // When you add an object to IPFS with a directory prefix in its path,
    // IPFS will create a directory structure for you. This is nice, because
    // it gives us URIs with descriptive filenames in them e.g.
    // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM/cat-pic.png' instead of
    // 'ipfs://QmaNZ2FCgvBPqnxtkbToVVbK2Nes6xk5K4Ns6BsmkPucAM'
    const imgPath = `/${config.ipfs.baseDirName}/${basename}`;
    const { cid: assetCid } = await this.ipfs.add(
      { path: imgPath, content },
      ipfsOptions
    );
    console.log('✅ Image pinned to IPFS');

    const parsedPath = path.parse(basename);
    const imageAsset = await uploadToS3(
      `${this.targetNetwork}/images/${basename}`,
      content
    );
    console.log('✅ Image uploaded to S3');

    // make the NFT metadata JSON
    const assetURI = imageAsset.Location;
    const metadata = await this.makeNFTMetadata(
      tokenId,
      traits,
      rarity,
      assetURI
    );

    return {
      tokenId,
      metadata,
      assetURI,
      assetGatewayURL: makeGatewayURL(assetURI),
    };
  }

  /**
   * Generate NFT from tokenId, uploading to local IPFS
   *
   * @param {number} tokenId - the unique ID of the new token
   *
   * @returns {Promise<GenerateNFTResult>}
   */
  async generateNFT(tokenId) {
    const traits = await this.getCharacterTraits(tokenId);
    const rarity = raritySelector();
    const filePath = await this.generateImage(tokenId, traits, rarity);
    const content = await fs.promises.readFile(filePath);
    return this.uploadNFTFromAssetData(
      tokenId,
      traits,
      filePath,
      content,
      rarity
    );
  }

  /**
   * Helper to generate image from character options
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {[]} traits - list of character traits from contract
   * @param {number} rarity - number of background rarity 0-3
   *
   * @returns {string} - NFT image filepath
   */
  // eslint-disable-next-line class-methods-use-this
  async generateImage(tokenId, traits, rarity) {
    const filePath = `./public/images/${this.targetNetwork}/${tokenId}.${
      rarity < 3 ? 'png' : 'mp4'
    }`;
    const url = generateImageURL(traits, rarity);
    console.log('🎮 Unity image url:', chalk.blue(url));
    console.log('');
    await downloadImage(url, filePath);
    return filePath;
  }

  /**
   * Helper to construct metadata JSON for character NFTs
   *
   * @param {number} tokenId - the unique ID of the new token
   * @param {[]} traits - list of character traits from contract
   * @param {number} rarity - number of background rarity 0-3
   * @param {string} assetURI - IPFS URI for the NFT asset
   *
   * @typedef {object} CreateMetadataResult
   * @property {string} name - optional name to set in NFT metadata
   * @property {object} image - an ipfs:// URI for the NFT asset
   * @property {string} description - optional description to store in NFT metadata
   * @property {string} external_url - an HTTP gateway URL for the NFT asset
   * @property {string} background_color - optional image background color to store in NFT metadata
   * @property {string} attributes - optional attributes to store in NFT metadata
   *
   * @returns {Promise<CreateMetadataResult>}
   */
  async makeNFTMetadata(tokenId, traits, rarity, assetURI) {
    const attributes = [
      { display_type: 'number', trait_type: 'Generation', value: 1 },
      { trait_type: 'Rarity', value: CHARACTER_RARITIES[rarity] },
    ];
    traits.forEach((trait, i) => {
      if (trait !== 0) {
        attributes.push({
          trait_type: CHARACTER_TRAIT_TYPES[i],
          value: TRAIT_VALUE_MAP[trait],
        });
      }
    });
    const metadata = {
      name:
        (await this.contract.getName(tokenId)) ||
        `${TRAIT_VALUE_MAP[traits[0]]} DEGEN #${tokenId}`,
      image: ensureIpfsUriPrefix(assetURI),
      description: config.metadata.description,
      external_url: `${config.metadata.externalURL}/${tokenId}`,
      attributes,
    };
    fs.writeFileSync(
      `./metadata/${this.targetNetwork}/${tokenId}.json`,
      JSON.stringify(metadata, null, 2)
    );
    return metadata;
  }

  //////////////////////////////////////////////
  // -------- NFT Retreival
  //////////////////////////////////////////////

  /**
   * Check if Metadata exists for tokenId
   * @param {string} tokenId
   *
   * @typedef {object} ExistsInfo
   * @property {boolean} tokenId
   * @property {object} metadata
   * @property {string} metadataURI
   * @returns {Promise<ExistsInfo>}
   */
  async checkTokenMetadataExists(tokenId) {
    const { metadata, metadataURI } = await this.getNFTMetadata(tokenId);
    return {
      exists: Boolean(metadata && Object.keys(metadata).length),
      metadata,
      metadataURI,
    };
  }

  /**
   * Get information about an existing token.
   * By default, this includes the token id, owner address, metadata, and metadata URI.
   * To include info about when the token was created and by whom, set `opts.fetchCreationInfo` to true.
   * To include the full asset data (base64 encoded), set `opts.fetchAsset` to true.
   *
   * @param {string} tokenId
   * @param {object} opts
   * @param {?boolean} opts.fetchAsset - if true, asset data will be fetched from IPFS and returned in assetData (base64 encoded)
   * @param {?boolean} opts.fetchCreationInfo - if true, fetch historical info (creator address and block number)
   *
   *
   * @typedef {object} NFTInfo
   * @property {string} tokenId
   * @property {string} ownerAddress
   * @property {object} metadata
   * @property {string} metadataURI
   * @property {string} metadataGatewayURI
   * @property {string} assetURI
   * @property {string} assetGatewayURL
   * @property {?string} assetDataBase64
   * @property {?object} creationInfo
   * @property {string} creationInfo.creatorAddress
   * @property {number} creationInfo.blockNumber
   * @returns {Promise<NFTInfo>}
   */
  async getNFT(tokenId, opts) {
    const { metadata, metadataURI } = await this.getNFTMetadata(tokenId);
    if (!metadata) return { metadata, metadataURI };
    const ownerAddress = await this.getTokenOwner(tokenId);
    const metadataGatewayURL = makeGatewayURL(metadataURI);
    const nft = {
      tokenId,
      metadata,
      metadataURI,
      metadataGatewayURL,
      ownerAddress,
    };

    const { fetchAsset, fetchCreationInfo } = opts || {};
    if (metadata.image) {
      nft.assetURI = metadata.image;
      nft.assetGatewayURL = makeGatewayURL(metadata.image);
      if (fetchAsset) {
        nft.assetDataBase64 = await this.getIPFSBase64(metadata.image);
      }
    }

    if (fetchCreationInfo) {
      nft.creationInfo = await this.getCreationInfo(tokenId);
    }
    return nft;
  }

  /**
   * Fetch the NFT metadata for a given token id.
   *
   * @param tokenId - the id of an existing token
   * @returns {Promise<{metadata: object, metadataURI: string}>} - resolves to an object containing the metadata and
   * metadata URI. Fails if the token does not exist, or if fetching the data fails.
   */
  async getNFTMetadata(tokenId) {
    const metadataURI = await this.contract.tokenURI(tokenId);
    let metadata;
    try {
      if (metadataURI.startsWith('ipfs')) {
        metadata = await this.getIPFSJSON(metadataURI);
      } else {
        const response = await fetch(metadataURI);
        metadata = await response.json();
      }
    } catch (e) {
      console.error('Error', e);
    }
    return { metadata, metadataURI };
  }

  //////////////////////////////////////////////
  // --------- Smart contract interactions
  //////////////////////////////////////////////

  /**
   * Get the address that owns the given token id.
   *
   * @param {string} tokenId - the id of an existing token
   * @returns {Promise<string>} - the ethereum address of the token owner. Fails if no token with the given id exists.
   */
  async getTokenOwner(tokenId) {
    return this.contract.ownerOf(tokenId);
  }

  /**
   * Get the traits for a specific token.
   *
   * @param {string} tokenId - the id of an existing token
   * @returns {Promise<[number]>} - list of character traits
   */
  async getCharacterTraits(tokenId) {
    return this.contract.getCharacterTraits(tokenId);
  }

  /**
   * Get historical information about the token.
   *
   * @param {string} tokenId - the id of an existing token
   *
   * @typedef {object} NFTCreationInfo
   * @property {number} blockNumber - the block height at which the token was minted
   * @property {string} creatorAddress - the ethereum address of the token's initial owner
   *
   * @returns {Promise<NFTCreationInfo>}
   */
  async getCreationInfo(tokenId) {
    const filter = await this.contract.filters.Transfer(
      null,
      null,
      ethers.BigNumber.from(tokenId)
    );

    const logs = await this.contract.queryFilter(filter);
    const blockNumber = logs[0].blockNumber;
    const creatorAddress = logs[0].args.to;
    return {
      blockNumber,
      creatorAddress,
    };
  }

  //////////////////////////////////////////////
  // --------- IPFS helpers
  //////////////////////////////////////////////

  /**
   * Get the full contents of the IPFS object identified by the given CID or URI.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<Uint8Array>} - contents of the IPFS object
   */
  async getIPFS(cidOrURI) {
    const cid = stripIpfsUriPrefix(cidOrURI);
    return uint8ArrayConcat(await all(this.ipfs.cat(cid)));
  }

  /**
   * Get the contents of the IPFS object identified by the given CID or URI, and return it as a string.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - the contents of the IPFS object as a string
   */
  async getIPFSString(cidOrURI) {
    const bytes = await this.getIPFS(cidOrURI);
    return uint8ArrayToString(bytes);
  }

  /**
   * Get the full contents of the IPFS object identified by the given CID or URI, and return it as a base64 encoded string.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - contents of the IPFS object, encoded to base64
   */
  async getIPFSBase64(cidOrURI) {
    const bytes = await this.getIPFS(cidOrURI);
    return uint8ArrayToString(bytes, 'base64');
  }

  /**
   * Get the contents of the IPFS object identified by the given CID or URI, and parse it as JSON, returning the parsed object.
   *
   * @param {string} cidOrURI - IPFS CID string or `ipfs://<cid>` style URI
   * @returns {Promise<string>} - contents of the IPFS object, as a javascript object (or array, etc depending on what was stored). Fails if the content isn't valid JSON.
   */
  async getIPFSJSON(cidOrURI) {
    const str = await this.getIPFSString(cidOrURI);
    return JSON.parse(str);
  }

  //////////////////////////////////////////////
  // -------- Pinning to remote services
  //////////////////////////////////////////////

  /**
   * Request that the remote pinning service pin the given CID or ipfs URI.
   *
   * @param {string} cidOrURI - a CID or ipfs:// URI
   * @returns {Promise<void>}
   */
  async pin(cidOrURI) {
    const cid = extractCID(cidOrURI);
    // Check if we've already pinned this CID to avoid a "duplicate pin" error.
    const pinned = await this.isPinned(cid);
    if (pinned) {
      console.log(`CID (${cid}) already pinned`);
      return;
    }
    // Ask the remote service to pin the content.
    // Behind the scenes, this will cause the pinning service to connect to our local IPFS node
    // and fetch the data using Bitswap, IPFS's transfer protocol.
    await this.ipfs.pin.add(cid);
  }

  /**
   * Request that the remote pinning service unpin the given CID or ipfs URI.
   *
   * @param {string|CID} cid - a CID
   * @returns {Promise<void>}
   */
  async unpin(cid) {
    // Check if we've actually pinned this CID to be removed.
    const pinned = await this.isPinned(cid);
    if (pinned) {
      // Ask the remote service to unpin the content.
      // Removes pin object matching query allowing it to be garbage collected
      console.log(`Unpinning CID (${cid})`);
      await this.ipfs.pin.rm(typeof cid === 'string' ? new CID(cid) : cid);
    }
  }

  /**
   * Check if a cid is already pinned.
   *
   * @param {string|CID} cid
   * @returns {Promise<boolean>} - true if the pinning service has already pinned the given cid
   */
  async isPinned(cid) {
    const opts = {
      cid: [[typeof cid === 'string' ? new CID(cid) : cid]], // ls expects an array of cids
    };
    // eslint-disable-next-line no-unused-vars
    for await (const result of this.ipfs.pin.ls(opts)) {
      return true;
    }
    return false;
  }
}

module.exports = { MakeMinty };
