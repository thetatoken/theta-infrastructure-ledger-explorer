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
  TFUEL_VOUCHER_MINTED: "0x80742bd15a2c8c4ad5d395bcf577073110e52f0c73bf980dfa9453c1d8c354e5",
  TRANSFER_SINGLE: "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"
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
  }]
}