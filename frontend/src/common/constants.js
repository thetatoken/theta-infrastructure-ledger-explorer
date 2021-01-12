export const WEI = 1000000000000000000;
export const GWEI = 1000000000;

export const ZeroAddress = '0x0000000000000000000000000000000000000000';

export const TxnTypes = {
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
}

export const TxnTypeText = {
  '0': 'Coinbase',
  '1': 'Slash',
  '2': 'Transfer',
  '3': 'Reserve fund',
  '4': 'Release fund',
  '5': 'Service Payment',
  '6': 'Split Contract',
  '7': 'Smart Contract',
  '8': 'Deposit Stake',
  '9': 'Withdraw Stake',
  '10': 'Deposit Stake'
}

export const TypeOptions = Object.keys(TxnTypeText)
  .map(key => ({ value: key, label: TxnTypeText[key] }))
  .filter(o => o.value !== '8')

export const TxnClasses = {
  '0': 'coinbase',
  '1': 'slash',
  '2': 'transfer',
  '3': 'reserve',
  '4': 'release',
  '5': 'service-payment',
  '6': 'split-contract',
  '7': 'smart-contract',
  '8': 'deposit-stake',
  '9': 'withdraw-stake',
  '10': 'deposit-stake'
}

export const TxnStatus = {
  FINALIZED: 'finalized',
  PENDING: 'pending',
}

export const BlockStatus = {
  0: 'Pending',
  1: 'Valid',
  2: 'Invalid',
  3: 'Committed',
  4: 'Finalized',
  5: 'Finalized',
  6: 'Finalized'
}

export const CurrencyLabels = {
  thetawei: 'Theta',
  tfuelwei: 'TFuel',
}

export const TxnPurpose = {
  0: 'Validator Staking',
  1: 'Guardian Staking',
}

export const TokenTypes = {
  THETA: 'theta',
  THETA_FUEL: 'tfuel',
};

export const Networks = {
  __deprecated__ETHEREUM: 'ethereum',
  THETA_TESTNET: 'testnet',
  THETA_TESTNET_AMBER: 'testnet_amber',
  THETA_TESTNET_SAPPHIRE: 'testnet_sapphire',
  THETA_MAINNET: 'mainnet',
  THETA_PRIVATENET: 'privatenet',
};

export const NetworkUrlOfChainId = {
  'https://explorer.thetatoken.org': Networks.THETA_MAINNET,
  'https://beta-explorer.thetatoken.org': Networks.THETA_TESTNET,
  'https://guardian-testnet-explorer-amber.thetatoken.org': Networks.THETA_TESTNET_AMBER,
  'https://guardian-testnet-explorer.thetatoken.org': Networks.THETA_TESTNET_SAPPHIRE,
  'https://smart-contracts-sandbox-explorer.thetatoken.org': Networks.THETA_PRIVATENET,
  'https://localhost': Networks.THETA_PRIVATENET,
};