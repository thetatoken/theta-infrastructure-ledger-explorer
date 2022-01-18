var get = require('lodash/get');
var map = require('lodash/map');
var BigNumber = require('bignumber.js');
var { ZeroAddress, ZeroTxAddress, EventHashMap } = require('./constants');
var { getHex } = require('./utils');
var { ethers } = require("ethers");
var Theta = require('../libs/Theta');
var ThetaJS = require('../libs/thetajs.esm');
var smartContractApi = require('../api/smart-contract-api');

exports.updateToken_new = async function (tx, smartContractDao, tokenDao, tokenSummaryDao, tokenHolderDao) {
  let addressList = _getContractAddressSet(tx);
  if (addressList.length === 0) {
    return;
  }
  let infoMap = {};
  // Generate info map
  for (let address of addressList) {
    infoMap[`${address}`] = {};
    const abiRes = await smartContractDao.getAbiAsync(address);
    const abi = get(abiRes[0], 'abi');
    if (!abi) {
      infoMap[`${address}`].abi = [];
      infoMap[`${address}`].type = 'unknown';
    } else {
      infoMap[`${address}`].abi = abi;
      infoMap[`${address}`].type = checkTnt721(abi) ? 'TNT-721' : checkTnt20(abi) ? 'TNT-20' : 'unknown';
      const tokenInfo = await tokenSummaryDao.getInfoByAddressAsync(address);
      infoMap[`${address}`].tokenName = get(tokenInfo, 'tokenName');
    }
  }
  console.log('Info map:', infoMap);
  let logs = get(tx, 'receipt.Logs');
  logs = JSON.parse(JSON.stringify(logs));
  // Only log of transfer event remains
  logs = logs.map(obj => {
    obj.data = getHex(obj.data);
    return obj;
  })
  console.log('logs in updateTokenNew:', logs)
  const tokenArr = [];
  logs = decodeLogs(logs, infoMap);
  const insertList = [];
  for (let [i, log] of logs.entries()) {
    if (get(log, 'topics[0]') !== EventHashMap.TRANSFER) {
      continue;
    }
    const contractAddress = get(log, 'address');
    const newToken = {
      _id: tx.hash + i,
      hash: tx.hash,
      from: get(log, 'decode.result.from'),
      to: get(log, 'decode.result.to'),
      tokenId: get(log, 'decode.result.tokenId'),
      value: get(log, 'decode.result.value'),
      name: get(infoMap, `${contractAddress}.name`),
      type: get(infoMap, `${contractAddress}.type`),
      timestamp: tx.timestamp,
      contract_address: contractAddress
    }
    tokenArr.push(newToken);
    insertList.push(checkAndInsertToken(newToken, tokenDao))
  }
  console.log('tokenArr:', tokenArr);
  await updateTokenSummary_new(tokenArr, infoMap, tokenSummaryDao, tokenHolderDao);
  return Promise.all(insertList);
}
// exports.updateToken = async function (tx, smartContractDao, tokenDao, tokenSummaryDao) {

//   let contractAddress = get(tx, 'receipt.ContractAddress');
//   if (contractAddress === undefined || contractAddress === ZeroAddress) {
//     return;
//   }

//   const abiRes = await smartContractDao.getAbiAsync(contractAddress);
//   const abi = get(abiRes[0], 'abi');
//   if (!abi) {
//     return;
//   }

//   const isTnt721 = checkTnt721(abi);
//   const isTnt20 = checkTnt20(abi);
//   if (!isTnt721 && !isTnt20) {
//     return;
//   }

//   let logs = get(tx, 'receipt.Logs');
//   logs = JSON.parse(JSON.stringify(logs));
//   logs = logs.map(obj => {
//     obj.data = getHex(obj.data);
//     return obj;
//   })
//   logs = decodeLogs(logs, abi);
//   const arr = abi.filter(obj => (obj.name == "tokenURI" && obj.type === 'function')
//     || (obj.name === 'Transfer' && obj.type === 'event'));
//   const tokenArr = [];
//   if (arr.length === 0) return;
//   let tokenName = "";
//   for (let [i, log] of logs.entries()) {
//     const tokenId = get(log, 'decode.result.tokenId');
//     const eventName = get(log, 'decode.eventName');
//     if (tokenId === undefined && eventName !== 'Transfer') {
//       return;
//     }
//     if (tokenName === "") {
//       tokenName = isTnt721 ? await _getTNT721Name(log, abi) : await _getTNT20Name(log, abi);
//     }
//     tokenArr.push({
//       id: tx.hash + i,
//       from: get(log, 'decode.result.from'),
//       to: get(log, 'decode.result.to'),
//       tokenId: get(log, 'decode.result.tokenId'),
//       value: get(log, 'decode.result.value'),
//     })
//   }

//   const insertList = [];
//   const type = isTnt20 ? 'TNT-20' : 'TNT-721';
//   tokenArr.forEach(token => {
//     const newToken = {
//       _id: token.id,
//       hash: tx.hash,
//       name: tokenName,
//       type: type,
//       token_id: token.tokenId,
//       from: token.from.toLowerCase(),
//       to: token.to.toLowerCase(),
//       value: token.value,
//       timestamp: tx.timestamp,
//       contract_address: contractAddress
//       //TODOs: add method field from decoded data
//     }
//     insertList.push(checkAndInsertToken(newToken, tokenDao))
//   })
//   await updateTokenSummary(contractAddress, tokenArr, tokenName, type, abi, tokenSummaryDao);
//   return Promise.all(insertList);
// }


function decodeLogs(logs, infoMap) {
  let ifaceMap = {};
  Object.keys(infoMap).forEach(k => ifaceMap[`${k}`] = new ethers.utils.Interface(infoMap[k].abi))
  return logs.map(log => {
    if (!infoMap[`${log.address}`]) {
      log.decode = 'No matched event or the smart contract source code has not been verified.';
      return log;
    }
    const iface = ifaceMap[`${log.address}`];
    const abi = infoMap[`${log.address}`].abi;
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

function checkTnt721(abi) {
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

function checkTnt20(abi) {
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

async function _getTNT20Name(log, abi) {
  const arr = abi.filter(obj => obj.name == "name" && obj.type === 'function');
  if (arr.length === 0) return "";
  const functionData = arr[0];
  const address = get(log, 'address');
  const inputValues = []

  const iface = new ethers.utils.Interface(abi || []);
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
    const result = get(callResponse, 'data.result');
    let outputValues = get(result, 'vm_return');
    const outputTypes = map(functionOutputs, ({ name, type }) => {
      return type;
    });
    outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;
    let url = abiCoder.decode(outputTypes, outputValues)[0];
    return url;
  } catch (e) {
    console.log('error occurs:', e.message);
    return "";
  }
}

async function _getTNT721Name(log, abi) {
  const tokenId = get(log, 'decode.result.tokenId');
  if (tokenId === undefined) return "";
  const arr = abi.filter(obj => obj.name == "tokenURI" && obj.type === 'function');
  if (arr.length === 0) return "";
  const functionData = arr[0];
  const address = get(log, 'address');
  const inputValues = [tokenId]

  const iface = new ethers.utils.Interface(abi || []);
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
    const result = get(callResponse, 'data.result');
    let outputValues = get(result, 'vm_return');
    const outputTypes = map(functionOutputs, ({ name, type }) => {
      return type;
    });
    outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;
    let url = abiCoder.decode(outputTypes, outputValues)[0];
    if (/^http:\/\/(.*)api.thetadrop.com.*\.json(\?[-a-zA-Z0-9@:%._\\+~#&//=]*){0,1}$/g.test(url) && typeof url === "string") {
      url = url.replace("http://", "https://")
    }
    const isImage = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|svg)/g.test(url);
    if (isImage) {
      return "";
    } else {
      return axios.get(url)
        .then(res => {
          return get(res, 'data.name')
        }).catch(e => {
          console.log('error occurs in fetch url:', e.message)
          return "";
        })
    }
  } catch (e) {
    console.log('error occurs:', e.message);
    return "";
  }
}

async function checkAndInsertToken(token, tokenDao) {
  let hasToken = await tokenDao.checkTokenAsync(token._id)
  if (hasToken) return;
  await tokenDao.insertAsync(token);
}

async function updateTokenSummary_new(tokenArr, infoMap, tokenSummaryDao, tokenHolderDao) {
  console.log('In updateTokenSummary')
  const tokenSummaryMap = {};

  // Generate tokenSummaryMap
  for (let address of Object.keys(infoMap)) {
    try {
      const info = await tokenSummaryDao.getInfoByAddressAsync(address);
      if (!info) continue;
      tokenSummaryMap[`${address}`] = info;
    } catch (e) {
      console.log(`Error in get token summary by address: ${address}. Error:`, e.message);
    }
  }
  console.log('tokenSummaryMap:', tokenSummaryMap);

  // Collect balance changes and store in holderMap
  /* holderMap = {
    ${contract_address}: {
      // TNT-20
      TNT20: {
        ${account_address}: balance_change,
        ...
      }
      // TNT-721
      ${tokenId}: {
        ${account_address}: balance_change,
        ...
      },
      ...
    },
    ... 
  }*/
  const holderMap = {};
  for (let token of tokenArr) {
    // If no tokenSummary info means it's not verified, handled in verify function later
    if (!tokenSummaryMap[`${token.contract_address}`] || token.type === 'unknown') {
      continue;
    }
    // Handle verified token
    if (!holderMap[`${token.contract_address}`]) {
      holderMap[`${token.contract_address}`] = {};
    }
    let holders = holderMap[`${token.contract_address}`];
    let from = token.from.toLowerCase();
    let to = token.to.toLowerCase();
    const key = token.tokenId != null ? token.tokenId : 'TNT20';
    let value = token.value || 1;
    if (from !== ZeroAddress) {
      if (holders[key] === undefined) {
        holders[key] = { [from]: new BigNumber(0).minus(value).toFixed(0) }
      } else if (holders[key][from] === undefined) {
        holders[key][from] = new BigNumber(0).minus(value).toFixed(0);
      } else {
        holders[key][from] = new BigNumber(holders[key][from]).minus(value).toFixed(0);
      }
    }
    if (to !== ZeroAddress) {
      if (holders[key] === undefined) {
        holders[key] = { [to]: new BigNumber(value).toFixed(0) }
      } else if (holders[key][to] === undefined) {
        holders[key][to] = new BigNumber(value).toFixed(0);
      } else {
        holders[key][to] = new BigNumber(holders[key][to]).plus(value).toFixed(0);
      }
    }
    tokenSummaryMap[`${token.contract_address}`].total_transfers++;
  }
  const updateAsyncList = [];
  for (let address of Object.keys(holderMap)) {
    const holders = holderMap[`${address}`];
    for (let key of Object.keys(holders)) {
      const map = holders[`${key}`];
      const tokenId = key === 'TNT20' ? null : key;
      let holderList = Object.keys(map);
      const newHolderList = new Set(holderList);
      const removeList = [];  // contains zero balance holders
      let list = await tokenHolderDao.getInfoByAddressAndHolderListAsync(address, tokenId, holderList);
      // Handle all holders which has a record, update or remove
      list.forEach(info => {
        const newAmount = BigNumber.sum(new BigNumber(info.amount), new BigNumber(map[`${info.holder}`]));
        if (newAmount.eq(0)) {
          removeList.push(info.holder);
        } else {
          console.log('update holder info:', { ...info, amount: newAmount.toFixed(0) })
          updateAsyncList.push(tokenHolderDao.upsertAsync({ ...info, amount: newAmount.toFixed(0) }))
        }
        newHolderList.delete(info.holder);
      });
      // Insert new holders 
      [...newHolderList].forEach(account => {
        console.log('insert new holder info: ',);
        updateAsyncList.push(tokenHolderDao.upsertAsync({
          contract_address: address,
          holder: account,
          amount: map[`${account}`],
          token_id: tokenId
        }))
      })
      // Remove zero balance holders in removeList
      updateAsyncList.push(tokenHolderDao.removeRecordByAdressAndHolderListAsync(address, tokenId, [...removeList]));
      // Update token summary holders
      if (key === 'TNT20') {
        tokenSummaryMap[`${address}`].holders.total += newHolderList.length - removeList.length;
      } else {
        if (tokenSummaryMap[`${address}`].holders[`${tokenId}`]) {
          tokenSummaryMap[`${address}`].holders[`${tokenId}`] = 0;
        }
        tokenSummaryMap[`${address}`].holders[`${tokenId}`] += newHolderList.length - removeList.length;
      }
    }
    updateAsyncList.push(tokenSummaryDao.upsertAsync({ ...tokenSummaryMap[`${address}`] }));
  }
  return Promise.all(updateAsyncList);
}

async function updateTokenSummary(address, tokenArr, tokenName, type, abi, tokenSummaryDao) {
  console.log('In updateTokenSummary')
  let tokenInfo = {
    _id: address,
    holders: {},
    max_total_supply: 0,
    total_transfers: -1,
    name: tokenName,
    type: type
  };
  try {
    let info = await tokenSummaryDao.getInfoByAddressAsync(address)
    if (info !== null) {
      tokenInfo = info;
    } else {
      //fetch max total supply
      tokenInfo.max_total_supply = await getMaxTotalSupply(address, abi)
    }
  } catch (e) {
    console.log('error:', e);
  }
  let holders = tokenInfo.holders;
  tokenArr.forEach(token => {
    let from = token.from.toLowerCase();
    let to = token.to.toLowerCase();
    const key = token.tokenId != null ? address + token.tokenId : address;
    let value = token.value || 1;
    if (from !== ZeroAddress) {
      if (holders[key] === undefined) {
        holders[key] = { [from]: new BigNumber(0).minus(value).toFixed() }
      } else if (holders[key][from] === undefined) {
        holders[key][from] = new BigNumber(0).minus(value).toFixed();
      } else {
        holders[key][from] = new BigNumber(holders[key][from]).minus(value).toFixed();
      }
      if (holders[key][from] == 0) delete holders[key][from];
      if (Object.keys(holders[key]).length == 0) delete holders[key];
    }
    if (holders[key] === undefined) {
      holders[key] = { [to]: new BigNumber(value).toFixed() }
    } else if (holders[key][to] === undefined) {
      holders[key][to] = new BigNumber(value).toFixed();
    } else {
      holders[key][to] = new BigNumber(holders[key][to]).plus(value).toFixed();
    }
    if (holders[key][to] == 0) delete holders[key][to];
    if (Object.keys(holders[key]).length == 0) delete holders[key];
  })
  tokenInfo.total_transfers++;
  await tokenSummaryDao.upsertAsync(tokenInfo);
}


async function getMaxTotalSupply(address, abi) {
  const arr = abi.filter(obj => obj.name == "totalSupply" && obj.type === 'function');
  if (arr.length === 0) return 0;
  const functionData = arr[0];
  const inputValues = []

  const iface = new ethers.utils.Interface(abi || []);
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
    const result = get(callResponse, 'data.result');
    let outputValues = get(result, 'vm_return');
    const outputTypes = map(functionOutputs, ({ name, type }) => {
      return type;
    });
    outputValues = /^0x/i.test(outputValues) ? outputValues : '0x' + outputValues;
    let max = abiCoder.decode(outputTypes, outputValues)[0];
    return max.toString();
  } catch (e) {
    console.log('error occurs:', e.message);
    return 0;
  }
}

function _getContractAddressSet(tx) {
  let logs = get(tx, 'receipt.Logs');
  if (!logs) return [];
  let set = new Set();
  logs.forEach(log => {
    if (get(log, 'topics[0]') === EventHashMap.TRANSFER) {
      const address = get(log, 'address');
      if (address !== undefined && address !== ZeroAddress) {
        set.add(get(log, 'address'))
      }
    }
  })
  return [...set];
}