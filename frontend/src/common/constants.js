export const WEI = 1000000000000000000;
export const GWEI = 1000000000;


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
  WITHDRAW_STAKE: 9
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
  '9': 'Withdraw Stake'
}

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