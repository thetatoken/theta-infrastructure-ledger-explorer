export const WEI = 1000000000000000000;
export const GWEI = 1000000000;


export const TxnTypes = {
  COINBASE: 0,
  SLASH: 1,
  SEND: 2,
  RESERVE_FUND: 3,
  RELEASE_FUND: 4,
  SERVICE_PAYMENT: 5,
  SPLIT_CONTRACT: 6,
  DEPOSIT_STAKE: 7,
  WITHDRAW_STAKE: 8,
  SMART_CONTRACT: 9,
}

export const TxnTypeText = {
  '0': 'Coinbase',
  '1': 'Slash',
  '2': 'Send',
  '3': 'Reserve fund',
  '4': 'Release fund',
  '5': 'Service Payment',
  '6': 'Split Contract',
  '7': 'Deposit Stake',
  '8': 'Withdraw Stake',
  '9': 'Smart Contract',
}

export const TxnClasses = {
  '0': 'coinbase',
  '1': 'slash',
  '2': 'send',
  '3': 'reserve',
  '4': 'release',
  '5': 'service-payment',
  '6': 'split-contract',
  '7': 'deposit-stake',
  '8': 'withdraw-stake',
  '9': 'smart-contract',
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

