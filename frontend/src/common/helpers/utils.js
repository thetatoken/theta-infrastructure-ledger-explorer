import BigNumber from 'bignumber.js';
import { ethers } from "ethers";
import get from 'lodash/get';
import map from 'lodash/map';

import { WEI, CommonEventABIs } from 'common/constants';
import smartContractApi from 'common/services/smart-contract-api';
import Theta from 'libs/Theta';
import ThetaJS from 'libs/thetajs.esm'

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

export function formatQuantity(amount, decimals, length = 4) {
  decimals = decimals || 0;
  let wei = new BigNumber(10).exponentiatedBy(decimals);
  return new BigNumber(amount).dividedBy(wei).decimalPlaces(length).toFormat({
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

export function timeCoin(amountA, amountB) {
  return new BigNumber(amountA).times(amountB);
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

export function validateHex(hash, limit) {
  const reg = new RegExp("^(0x){0,1}[0-9a-fA-F]{" + limit + "}$");
  return reg.test(hash);
}

export function decodeLogs(logs, abiMap) {
  let ifaceMap = {};
  Object.keys(abiMap).forEach(k => ifaceMap[`${k}`] = new ethers.utils.Interface(abiMap[k]))
  return logs.map(log => {
    const iface = ifaceMap[log.address] ? ifaceMap[log.address] : new ethers.utils.Interface([]);
    const abi = abiMap[log.address] ? abiMap[log.address] : [];
    try {
      let event = null;
      for (let i = 0; i < abi.length; i++) {
        let item = abi[i];
        if (item.type != "event") continue;
        const hash = iface.getEventTopic(item.name)
        if (hash == log.topics[0]) {
          event = item;
          break;
        }
      }
      if (event != null) {
        let bigNumberData = iface.decodeEventLog(event.name, log.data, log.topics);
        let data = {};
        Object.keys(bigNumberData).forEach(k => {
          data[k] = bigNumberData[k].toString();
        })
        log.decode = {
          result: data,
          eventName: event.name,
          event: event
        }
      } else if (CommonEventABIs[log.topics[0]] !== undefined) {
        const events = CommonEventABIs[log.topics[0]];
        for (let event of events) {
          try {
            const ifaceTmp = new ethers.utils.Interface([event] || []);
            let bigNumberData = ifaceTmp.decodeEventLog(event.name, log.data, log.topics);
            let data = {};
            Object.keys(bigNumberData).forEach(k => {
              data[k] = bigNumberData[k].toString();
            })
            log.decode = {
              result: data,
              eventName: event.name,
              event: event
            }
            break;
          } catch (e) {
            continue;
          }
        }
        if (typeof log.decode !== 'object') {
          log.decode = 'No matched event or the smart contract source code has not been verified.';
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

export function checkTnt721(abi) {
  const obj = {
    'balanceOf': { contains: false, type: 'function' },
    'ownerOf': { contains: false, type: 'function' },
    'safeTransferFrom': { contains: false, type: 'function' },
    'transferFrom': { contains: false, type: 'function' },
    'approve': { contains: false, type: 'function' },
    'setApprovalForAll': { contains: false, type: 'function' },
    'getApproved': { contains: false, type: 'function' },
    'isApprovedForAll': { contains: false, type: 'function' },
    'Transfer': { contains: false, type: 'event' },
    'Approval': { contains: false, type: 'event' },
    'ApprovalForAll': { contains: false, type: 'event' },
  }

  return _check(obj, abi);
}

export function checkTnt20(abi) {
  const obj = {
    'name': { contains: false, type: 'function' },
    'symbol': { contains: false, type: 'function' },
    'decimals': { contains: false, type: 'function' },
    'totalSupply': { contains: false, type: 'function' },
    'balanceOf': { contains: false, type: 'function' },
    'transfer': { contains: false, type: 'function' },
    'transferFrom': { contains: false, type: 'function' },
    'approve': { contains: false, type: 'function' },
    'allowance': { contains: false, type: 'function' },
    'Transfer': { contains: false, type: 'event' },
    'Approval': { contains: false, type: 'event' },
  }

  return _check(obj, abi);
}

function _check(obj, abi) {
  abi.forEach(o => {
    if (obj[o.name] !== undefined) {
      if (obj[o.name].type === o.type) {
        obj[o.name].contains = true
      }
    }
  })
  let res = true;
  for (let key in obj) {
    res = res && obj[key].contains
  }
  return res;
}

export async function fetchBalanceByAddress(address, account) {
  const balanceAbi = [{
    "constant": true,
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }];
  const functionData = balanceAbi[0];
  const inputValues = [account]

  const iface = new ethers.utils.Interface(balanceAbi || []);
  const senderSequence = 1;
  const functionInputs = get(functionData, ['inputs'], []);
  const functionOutputs = get(functionData, ['outputs'], []);
  const functionSignature = iface.getSighash(functionData.name)

  const inputTypes = map(functionInputs, ({ name, type }) => {
    return type;
  });
  try {
    var abiCoder = new ethers.utils.AbiCoder();
    var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2);;
    const gasPrice = Theta.getTransactionFee(); //feeInTFuelWei;
    const gasLimit = 2000000;
    const data = functionSignature + encodedParameters;
    const tx = Theta.unsignedSmartContractTx({
      from: address,
      to: address,
      data: data,
      value: 0,
      transactionFee: gasPrice,
      gasLimit: gasLimit
    }, senderSequence);
    const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);
    const callResponse = await smartContractApi.callSmartContract({ data: rawTxBytes.toString('hex').slice(2) }, { network: Theta.chainId });
    const callResponseJSON = await callResponse.json();
    const result = get(callResponseJSON, 'result');

    let outputValues = get(result, 'vm_return');
    const outputTypes = map(functionOutputs, ({ name, type }) => {
      return type;
    });
    outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;

    let balance = abiCoder.decode(outputTypes, outputValues)[0];
    return balance;
  } catch (e) {
    console.log('error occurs in fetchTokenBalance:', e.message);
    return 0;
  }
}


export async function fetchWTFuelTotalSupply() {
  const totalSupplyAbi = [{
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }];
  const functionData = totalSupplyAbi[0];
  const inputValues = []

  const iface = new ethers.utils.Interface(totalSupplyAbi || []);
  const senderSequence = 1;
  const functionInputs = get(functionData, ['inputs'], []);
  const functionOutputs = get(functionData, ['outputs'], []);
  const functionSignature = iface.getSighash(functionData.name)

  const inputTypes = map(functionInputs, ({ name, type }) => {
    return type;
  });

  const address = "0x4dc08b15ea0e10b96c41aec22fab934ba15c983e";

  try {
    var abiCoder = new ethers.utils.AbiCoder();
    var encodedParameters = abiCoder.encode(inputTypes, inputValues).slice(2);;
    const gasPrice = Theta.getTransactionFee(); //feeInTFuelWei;
    const gasLimit = 2000000;
    const data = functionSignature + encodedParameters;
    const tx = Theta.unsignedSmartContractTx({
      from: address,
      to: address,
      data: data,
      value: 0,
      transactionFee: gasPrice,
      gasLimit: gasLimit
    }, senderSequence);
    const rawTxBytes = ThetaJS.TxSigner.serializeTx(tx);
    const callResponse = await smartContractApi.callSmartContract({ data: rawTxBytes.toString('hex').slice(2) }, { network: Theta.chainId });
    const callResponseJSON = await callResponse.json();
    const result = get(callResponseJSON, 'result');

    let outputValues = get(result, 'vm_return');
    const outputTypes = map(functionOutputs, ({ name, type }) => {
      return type;
    });
    outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;

    let balance = abiCoder.decode(outputTypes, outputValues)[0];
    return balance.toString();
  } catch (e) {
    console.log('error occurs in fetchWTFuelTotalSupply:', e.message);
    return 0;
  }
}