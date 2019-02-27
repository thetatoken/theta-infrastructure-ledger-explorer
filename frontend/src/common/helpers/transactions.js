import { BigNumber } from 'bignumber.js';
import _ from 'lodash';
import moment from 'moment';

import { WEI } from 'common/constants';
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

export function from(txn, trunc = null) {
  let a = _.get(txn, 'data.source.address')
  if(trunc && trunc > 0) {
    a = _.truncate(a, trunc);
  }
  return a;
}

export function to(txn, trunc = null) {
  let a = _.get(txn, 'data.target.address')
  if(trunc && trunc > 0) {
    a = _.truncate(a, trunc);
  }
  return a;
}

export function fee(txn) {
  let f = _.get(txn, 'data.fee.tfuelwei');
  f = BigNumber(f).dividedBy(WEI);
  return f.toString();
}

export function value(txn) {
  let values = [
    _.get(txn, 'data.source.coins.tfuelwei'),
    _.get(txn, 'data.source.coins.thetawei')];
  return _.chain(values)
    .map(v => v ? new BigNumber(v).dividedBy(WEI) : undefined)
    .filter(Boolean)
    .map(v => v.toString(10))
    .value();
}

export function hash(txn, trunc = null) {
  let a = _.get(txn, 'hash')
  if(trunc && trunc > 0) {
    a = _.truncate(a, { length: trunc });
  }
  return a;
}

export function age(txn) {
  return moment(parseInt(txn.timestamp) * 1000).fromNow(true);
}

export function date(txn) {
  return moment(parseInt(txn.timestamp) * 1000).format("MM/DD/YY hh:mma");
}
