import _ from 'lodash';
import BigNumber from 'bignumber.js';

import { WEI } from 'common/constants';

export function truncateMiddle(str, maxLength = 20, separator = '...') {
  if (str && str.length <= 20)
    return str

  let diff = maxLength - separator.length;
  let front = Math.ceil(diff / 2);
  let back = Math.floor(diff / 2);
  return str.substr(0, front) + separator + str.substr(str.length - back);
}

export function formatCoin(weiAmount) {
  return new BigNumber(weiAmount).dividedBy(WEI).toFormat({
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
  });
}

export function getQueryParam(search, name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  let results = regex.exec(search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}