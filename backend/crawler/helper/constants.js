exports.TxnTypes = {
  COINBASE: 0,
  SLASH: 1,
  TRANSFER: 2,
  RESERVE_FUND: 3,
  RELEASE_FUND: 4,
  SERVICE_PAYMENT: 5,
  SPLIT_CONTRACT: 6,
  SMART_CONTRACT: 7,
  DEPOSIT_STAKE: 8,
  WITHDRAW_STAKE: 9,
  DEPOSIT_STAKE_TX_V2: 10,
  STAKE_REWARD_DISTRIBUTION: 11
}

exports.ZeroAddress = '0x0000000000000000000000000000000000000000';

exports.ZeroTxAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';

exports.EventHashMap = {
  TRANSFER: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  TFUEL_SPLIT: "0x8adc8f535d46b08a2d88aa746c6d751130fde18f5f2d59b755f134099ca01457",
  TRANSFER_SINGLE: "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
  TFUEL_VOUCHER_MINTED: "0x80742bd15a2c8c4ad5d395bcf577073110e52f0c73bf980dfa9453c1d8c354e5",
  TFUEL_VOUCHER_BURNED: "0x40f1d475c2aa44f5c23193fab26a64d6aa4e09ab51898b10a3036baf82398ea1",
  TFUEL_TOKEN_LOCKED: "0xee1ecc2b21aa613cc77cd44823a68ef1168ce1f40c2eac1d68690baf955fdbd1",
  TFUEL_TOKEN_UNLOCKED: "0x5ea3a5ca7f54881fdd7781894d69709e11027910f35647f9d4cc14e6872b6f72",
  TNT20_VOUCHER_MINTED: "0x5249cf5aa9f373a9fda5076a53abb87450615986fd25b4d701a153f8840eaf08",
  TNT20_VOUCHER_BURNED: "0x8cd7380d25c66046ede32c8a8089e2c5c5356ed48d6885bb3956f3a1bc4f030d",
  TNT20_TOKEN_LOCKED: "0xe5d8852bc02bf44f2a49b2d7722fa497ff83b689a28de1253304d2bc43d7b1cb",
  TNT20_TOKEN_UNLOCKED: "0x189b6301573b050cb7c350cae6d2d5c6262fda802e3b6cc69ee25eb35bdaa4eb",
  TNT721_VOUCHER_MINTED: "",
  TNT721_VOUCHER_BURNED: "",
  TNT721_TOKEN_LOCKED: "",
  TNT721_TOKEN_UNLOCKED: "",
  TNT1155_VOUCHER_MINTED: "",
  TNT1155_VOUCHER_BURNED: "",
  TNT1155_TOKEN_LOCKED: "",
  TNT1155_TOKEN_UNLOCKED: ""
}

exports.CommonEventABIs = {
  "0x8adc8f535d46b08a2d88aa746c6d751130fde18f5f2d59b755f134099ca01457": [{
    anonymous: false,
    inputs: [{ indexed: true, internalType: "address", name: "seller", type: "address" },
    { indexed: false, internalType: "uint256", name: "sellerEarning", type: "uint256" },
    { indexed: true, internalType: "address", name: "platformFeeRecipient", type: "address" },
    { indexed: false, internalType: "uint256", name: "platformFee", type: "uint256" }],
    name: "TFuelSplit",
    type: "event"
  }],
  "0x80742bd15a2c8c4ad5d395bcf577073110e52f0c73bf980dfa9453c1d8c354e5": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "targetChainVoucherReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "mintedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "sourceChainTokenLockNonce", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "voucherMintNonce", "type": "uint256" }],
    "name": "TFuelVoucherMinted",
    "type": "event"
  }],
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": [{
    anonymous: false,
    inputs: [{ indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' }],
    name: 'Transfer',
    type: 'event'
  }, {
    anonymous: false,
    inputs: [{ indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' }],
    name: 'Transfer',
    type: 'event'
  }],
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62": [{
    "anonymous": false,
    "inputs": [{ "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
    { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
    { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }],
    "name": "TransferSingle",
    "type": "event"
  }],
  "0x40f1d475c2aa44f5c23193fab26a64d6aa4e09ab51898b10a3036baf82398ea1": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "sourceChainVoucherOwner", "type": "address" },
    { "indexed": false, "internalType": "address", "name": "targetChainTokenReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "burnedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "voucherBurnNonce", "type": "uint256" }],
    "name": "TFuelVoucherBurned",
    "type": "event"
  }],
  "0x5ea3a5ca7f54881fdd7781894d69709e11027910f35647f9d4cc14e6872b6f72": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "sourceChainTokenSender", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "targetChainID", "type": "uint256" },
    { "indexed": false, "internalType": "address", "name": "targetChainVoucherReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "lockedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "tokenLockNonce", "type": "uint256" }],
    "name": "TFuelTokenLocked",
    "type": "event"
  }],
  "0x5ea3a5ca7f54881fdd7781894d69709e11027910f35647f9d4cc14e6872b6f72": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "targetChainTokenReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "unlockedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "sourceChainVoucherBurnNonce", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "tokenUnlockNonce", "type": "uint256" }],
    "name": "TFuelTokenUnlocked",
    "type": "event"
  }],
  "0x5249cf5aa9f373a9fda5076a53abb87450615986fd25b4d701a153f8840eaf08": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "targetChainVoucherReceiver", "type": "address" },
    { "indexed": false, "internalType": "address", "name": "voucherContract", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "mintedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "sourceChainTokenLockNonce", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "voucherMintNonce", "type": "uint256" }],
    "name": "TNT20VoucherMinted",
    "type": "event"
  }],
  "0x8cd7380d25c66046ede32c8a8089e2c5c5356ed48d6885bb3956f3a1bc4f030d": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "sourceChainVoucherOwner", "type": "address" },
    { "indexed": false, "internalType": "address", "name": "targetChainTokenReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "burnedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "voucherBurnNonce", "type": "uint256" }],
    "name": "TNT20VoucherBurned",
    "type": "event"
  }],
  "0xe5d8852bc02bf44f2a49b2d7722fa497ff83b689a28de1253304d2bc43d7b1cb": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "sourceChainTokenSender", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "targetChainID", "type": "uint256" },
    { "indexed": false, "internalType": "address", "name": "targetChainVoucherReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "lockedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
    { "indexed": false, "internalType": "string", "name": "symbol", "type": "string" },
    { "indexed": false, "internalType": "uint8", "name": "decimals", "type": "uint8" },
    { "indexed": false, "internalType": "uint256", "name": "tokenLockNonce", "type": "uint256" }],
    "name": "TNT20TokenLocked", 
    "type": "event"
  }],
  "0x189b6301573b050cb7c350cae6d2d5c6262fda802e3b6cc69ee25eb35bdaa4eb": [{
    "anonymous": false,
    "inputs": [{ "indexed": false, "internalType": "string", "name": "denom", "type": "string" },
    { "indexed": false, "internalType": "address", "name": "targetChainTokenReceiver", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "unlockedAmount", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "sourceChainVoucherBurnNonce", "type": "uint256" },
    { "indexed": false, "internalType": "uint256", "name": "tokenUnlockNonce", "type": "uint256" }],
    "name": "TNT20TokenUnlocked",
    "type": "event"
  }]
}



/**
 * 
 * 
  Examples:

  TFUEL_VOUCHER_MINTED: "0xcca362e4fdf48ba656a0aaefe57bb3cab632dfed9da40e5e86e6efbc5be53542" subchain
  TFUEL_VOUCHER_BURNED: "0x8a0ab3ab46c4633875d424834b59a2c78d620422f99d869a557e3057e3b59304", subchain
  TFUEL_TOKEN_LOCKED: "0xd5d15d8d19c5362e08bdc908c7f7681f5ec7c7e35caeaadabe5c4e14bede8a52", mainnet
  TFUEL_TOKEN_UNLOCKED: "0x12fca0db67feffc2e5060a6541c0e5567acebe6432fe7dc5c8e07bb1c8e25986", mainnet

  TNT20_VOUCHER_MINTED: "0x53a951baffa2d092a4bb05255a4f0b023c652538bd98156a5eb44eac49168dc4", subchain
  TNT20_VOUCHER_BURNED: "0x4825889ffe220e3af874c9f8abcb7ee8c58b704a7304446267a62754da5d038c", subchain
  TNT20_TOKEN_LOCKED: "0x2e7c68b8d667801639dec7fc576f1e62b771f1a227d167c45fb19c0a819d69e9", mainnet
  TNT20_TOKEN_UNLOCKED: "0x13ddf75b0a8414f38eb6f34cfbef3d437cc2f4faca3ca311e9163ee4352da1ca",mainnet

  TNT721_VOUCHER_MINTED: "",
  TNT721_VOUCHER_BURNED: "",
  TNT721_TOKEN_LOCKED: "",
  TNT721_TOKEN_UNLOCKED: "",

  TNT1155_VOUCHER_MINTED: "",
  TNT1155_VOUCHER_BURNED: "",
  TNT1155_TOKEN_LOCKED: "",
  TNT1155_TOKEN_UNLOCKED: ""
 */