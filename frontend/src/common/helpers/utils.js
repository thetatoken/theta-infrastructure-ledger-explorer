import BigNumber from 'bignumber.js';
import Web3 from "web3";

const web3 = new Web3("http://localhost:3000");

import { WEI } from 'common/constants';

export function truncateMiddle(str, maxLength = 20, separator = '...') {
  if (str && str.length <= 20)
    return str

  let diff = maxLength - separator.length;
  let front = Math.ceil(diff / 2);
  let back = Math.floor(diff / 2);
  return str.substr(0, front) + separator + str.substr(str.length - back);
}

export function formatNumber(num, length = 0) {
  return num.toFixed(length).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

export function formatCurrency(num, length = 2) {
  return '$' + num.toFixed(length).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

export function formatCoin(weiAmount, length = 4) {
  return new BigNumber(weiAmount).dividedBy(WEI).decimalPlaces(length).toFormat({
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
  });
}

export function priceCoin(weiAmount, price) {
  return new BigNumber(weiAmount).dividedBy(WEI).multipliedBy(price).decimalPlaces(2).toFormat({
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
  });
}

export function sumCoin(weiAmountA, weiAmountB) {
  return BigNumber.sum(new BigNumber(weiAmountA), new BigNumber(weiAmountB));
}

export function getQueryParam(search, name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  let results = regex.exec(search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

export function getTheta(weiAmount) {
  return new BigNumber(weiAmount).dividedBy(WEI).toFixed();
}

export function getHex(str) {
  const buffer = Buffer.from(str, 'base64');
  const bufString = buffer.toString('hex');
  return '0x' + bufString;
}

export function getArguments(str) {
  let res = str;
  const num = Math.floor(str.length / 64);
  res += `\n\n---------------Encoded View---------------\n${num} Constructor Argument${num > 1 ? 's' : ''} found :\n`;
  for (let i = 0; i < num; i++) {
    res += `Arg [${i}] : ` + str.substring(i * 64, (i + 1) * 64) + '\n';
  }
  return res;
}

export function decodeLogs(logs, abi) {
  return logs.map(log => {
    try {
      let event = null;
      for (let i = 0; i < abi.length; i++) {
        let item = abi[i];
        if (item.type != "event") continue;
        let signature = item.name + "(" + item.inputs.map(function (input) { return input.type; }).join(",") + ")";
        // console.log("signature: ",signature)
        let hash = web3.utils.sha3(signature);
        // console.log("hash:", hash)
        if (hash == log.topics[0]) {
          event = item;
          break;
        }
      }
      // console.log(event);
      if (event != null) {
        let inputs = event.inputs;
        let data = web3.eth.abi.decodeLog(inputs, log.data, log.topics);
        // console.log('data:', data)
        log.decode = {
          result: data,
          eventName: event.name
        }
      } else {
        log.decode = 'No matched event or the smart contract source code has not been verified.';
      }
      return log;
    } catch (e) {
      log.decode = 'Something wrong while decoding, met error: ' + e;
      return log;
    }
  })
}