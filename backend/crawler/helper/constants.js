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
  TFUEL_SPLIT: "0x8adc8f535d46b08a2d88aa746c6d751130fde18f5f2d59b755f134099ca01457"
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
  }]
}