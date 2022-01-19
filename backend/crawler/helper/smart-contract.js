var get = require('lodash/get');
var map = require('lodash/map');
var BigNumber = require('bignumber.js');
var { getHex } = require('./utils');
var { ethers } = require("ethers");

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
    // If log.address === tx.receipt.ContractAddress, and the contract has not been verified
    // this record will be hanlded in the contract verification
    if (get(infoMap, `${contractAddress}.type`) === 'unknow' && contractAddress === get(tx, 'receipt.ContractAddress')) {
      continue;
    }
    const newToken = {
      _id: tx.hash + i,
      hash: tx.hash,
      from: get(log, 'decode.result.from'),
      to: get(log, 'decode.result.to'),
      token_id: get(log, 'decode.result.tokenId'),
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
    const key = token.token_id != null ? token.token_id : 'TNT20';
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
  await Promise.all(updateAsyncList);
  const updateHoldersList = [];
  // Update tokenSummary.total for TNT-721 tokens
  for (let address of Object.keys(tokenSummaryMap)) {
    if (tokenSummaryMap[`${address}`].type !== 'TNT-721') {
      continue;
    }
    try {
      const holderList = await tokenHolderDao.getHolderListAsync(address, null);
      let holderSet = new Set(holderList.map(info => info.holder));
      tokenSummaryMap[`${address}`].holders.total = holderSet.size;
      updateHoldersList.push(tokenSummaryDao.upsertAsync({ ...tokenSummaryMap[`${address}`] }))
    } catch (e) {
      console.log('Error in update tokenSummary.total for TNT-721 tokens. Error:', e.message);
    }
  }
  return Promise.all(updateHoldersList);
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