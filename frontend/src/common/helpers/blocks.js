import BigNumber from 'bignumber.js';
import moment from 'moment';
import reduce from 'lodash/reduce';
import get from 'lodash/get';
import truncate from 'lodash/truncate';

import { GWEI, WEI } from 'common/constants';

export function averageFee(block) {
  BigNumber.set({ DECIMAL_PLACES: 2 });
  return reduce(block.txs, (bn, t) => bn.plus(new BigNumber(get(t, 'raw.fee.tfuelwei', 0))), new BigNumber(0))
    .dividedBy(block.num_txs)
    .dividedBy(GWEI)
    .toString(10);
}

export function totalTfuelBurnt(block) {
  BigNumber.set({ DECIMAL_PLACES: 2 });
  return reduce(block.txs, (bn, t) => bn.plus(new BigNumber(get(t, 'raw.fee.tfuelwei', 0))), new BigNumber(0))
    .dividedBy(WEI)
    .toString(10);
}

export function hash(block, trunc = null) {
  let a = get(block, 'hash')
  if (trunc && trunc > 0) {
    a = truncate(a, { length: trunc });
  }
  return a;
}

export function age(block) {
  return moment(parseInt(block.timestamp) * 1000).fromNow(true);
}

export function date(block) {
  return moment(parseInt(block.timestamp) * 1000).format("MM/DD/YY hh:mma");
}

export function prevBlock(block) {
  return block.parent_hash;
}