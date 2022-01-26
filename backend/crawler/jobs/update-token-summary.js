var get = require('lodash/get');
var map = require('lodash/map');
var Logger = require('../helper/logger');
var { checkTnt721, checkTnt20 } = require('../helper/smart-contract');
var { getHex } = require('../helper/utils');
var { ethers } = require("ethers");

var BigNumber = require('bignumber.js');
var Theta = require('../libs/Theta');
var ThetaJS = require('../libs/thetajs.esm');
var smartContractApi = require('../api/smart-contract-api');

const { default: axios } = require('axios');
const { EventHashMap, ZeroAddress } = require('../helper/constants');

var transactionDao = null;
var accountTxDao = null;
var smartContractDao = null;
var tokenDao = null;
var tokenHolderDao = null;
var tokenSummaryDao = null;

exports.Initialize = function (transactionDaoInstance, accountTxDaoInstance, smartContractDaoInstance,
  tokenDaoInstance, tokenHolderDaoInstance, tokenSummaryDaoInstance) {
  transactionDao = transactionDaoInstance;
  accountTxDao = accountTxDaoInstance;
  smartContractDao = smartContractDaoInstance;
  tokenDao = tokenDaoInstance;
  tokenHolderDao = tokenHolderDaoInstance;
  tokenSummaryDao = tokenSummaryDaoInstance;
}
exports.UpdateTNT721Name = async function () {
  let tokenSummaryInfoList = [];
  try {
    tokenSummaryInfoList = await tokenSummaryDao.getRecordsAsync({ type: "TNT-721", name: "" });
    Logger.log('tokenSummaryInfoList[0]:', tokenSummaryInfoList[0]);
    Logger.log('tokenSummaryInfoList.length:', tokenSummaryInfoList.length);
  } catch (e) {
    Logger.log('Error occurs in get tokenSummary info:', e.message);
  }
  for (let i = 0; i < tokenSummaryInfoList.length; i++) {
    const tokenInfo = tokenSummaryInfoList[i];
    const address = tokenInfo._id;
    const startTime = +new Date();
    Logger.log('-----------------------------------------------------------------------------------');
    Logger.log(`Processing token summary #${i + 1}/${tokenSummaryInfoList.length} with address:${address}.`);
    const nameAbi = [{
      "inputs": [],
      "name": "name",
      "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
      "stateMutability": "view",
      "type": "function"
    }];
    let tokenName = ""
    try {
      tokenName = await _getTNT20Name(address, nameAbi);
    } catch (e) {
      Logger.log('Error in fetch token name by name function in updateTokenHistoryBySmartContract: ', e.message);
    }
    Logger.log('tokenName after name function:', tokenName);
    const tokenURIAbi = [{
      "constant": true,
      "inputs": [{ "name": "_tokenId", "type": "uint256" }],
      "name": "tokenURI",
      "outputs": [{ "name": "", "type": "string" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }];
    if (tokenName === "") {
      try {
        tokenName = await _getTNT721Name(address, tokenURIAbi);
      } catch (e) {
        Logger.log('Error in fetch TNT-721 token name by tokenURI in updateTokenHistoryBySmartContract: ', e.message);
      }
      Logger.log('tokenName after tokenURI function:', tokenName);
    }
    if (tokenName !== "") {
      tokenInfo.name = tokenName;
      await tokenSummaryDao.upsertAsync({ ...tokenInfo });
    }
    Logger.log(`Complete update token summary #${i}/${tokenSummaryInfoList.length} Add:${address}. Takes ${(+new Date() - startTime) / 1000} seconds`);
    Logger.log('-----------------------------------------------------------------------------------');
  }
  Logger.log('Mission Completed!');
}
exports.UpdateTNT20Decimals = async function () {
  let tokenSummaryInfoList = [];
  try {
    tokenSummaryInfoList = await tokenSummaryDao.getRecordsAsync({ type: "TNT-20" });
    Logger.log('tokenSummaryInfoList[0]:', tokenSummaryInfoList[0]);
    Logger.log('tokenSummaryInfoList.length:', tokenSummaryInfoList.length);
  } catch (e) {
    Logger.log('Error occurs in get tokenSummary info:', e.message);
  }
  for (let i = 0; i < tokenSummaryInfoList.length; i++) {
    const tokenInfo = tokenSummaryInfoList[i];
    const address = tokenInfo._id;
    const startTime = +new Date();
    Logger.log('-----------------------------------------------------------------------------------');
    Logger.log(`Processing token summary #${i + 1}/${tokenSummaryInfoList.length} with address:${address}.`);
    const abi = [{
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }];
    let decimals = 0;
    try {
      decimals = await getDecimals(address, abi);
    } catch (e) {
      Logger.log('Error in fetch decimals in UpdateTNT20Decimals: ', e.message);
    }
    tokenInfo.decimals = decimals;
    await tokenSummaryDao.upsertAsync({ ...tokenInfo });
    Logger.log(`Complete update token summary #${i}/${tokenSummaryInfoList.length} Add:${address}. Takes ${(+new Date() - startTime) / 1000} seconds`);
    Logger.log('-----------------------------------------------------------------------------------');
  }
  Logger.log('Mission Completed!');
}

exports.Execute = async function () {
  let smartContractIds = [], tokenSummaryIds = [], tokenSummarySet;
  try {
    smartContractIds = await smartContractDao.getAllIdsAsync({ source_code: { $ne: "" } });
    smartContractIds = smartContractIds.map(o => o._id);
    Logger.log('smartContractIds:', smartContractIds);
    tokenSummaryIds = await tokenSummaryDao.getAllIdsAsync();
    tokenSummaryIds = tokenSummaryIds.map(o => o._id);
    Logger.log('tokenSummaryIds:', tokenSummaryIds);
    tokenSummarySet = new Set(tokenSummaryIds);
  } catch (e) {
    Logger.log('Error occurs in get ids:', e.message);
  }
  for (let i = 0; i < smartContractIds.length; i++) {
    const address = smartContractIds[i];
    const startTime = +new Date();
    Logger.log('-----------------------------------------------------------------------------------');
    Logger.log(`Processing smart contract #${i + 1}/${smartContractIds.length} with address:${address}.`);
    let abi;
    try {
      const abiRes = await smartContractDao.getAbiAsync(address);
      abi = get(abiRes[0], 'abi');
    } catch (e) {
      Logger.log(`Error occurs in get abi by address:${address}. Error: ${e.message}`);
    }
    if (!abi) {
      Logger.log(`Smart contract #${i}/${smartContractIds.length} Add:${address} doesn't have abi field, skip.`);
      continue;
    }

    const isTnt721 = checkTnt721(abi);
    const isTnt20 = checkTnt20(abi);
    if (!isTnt721 && !isTnt20) {
      Logger.log(`Smart contract #${i}/${smartContractIds.length} Add:${address} is not TNT-721 or TNT-20, skip.`);
      continue;
    }

    if (tokenSummarySet.has(address)) {
      Logger.log(`Smart contract #${i}/${smartContractIds.length} Add:${address} is been updated in tokenSummaryDao, skip.`);
      continue;
    }
    const tokenType = isTnt721 ? 'TNT-721' : 'TNT-20';
    Logger.log('Token type:', tokenType);
    let tokenName = ""
    try {
      tokenName = await _getTNT20Name(address, abi);
    } catch (e) {
      Logger.log('Error in fetch token name by name function in updateTokenHistoryBySmartContract: ', e.message);
    }
    Logger.log('tokenName after name function:', tokenName);
    if (tokenName === "" && isTnt721) {
      try {
        tokenName = await _getTNT721Name(address, abi);
      } catch (e) {
        Logger.log('Error in fetch TNT-721 token name by tokenURI in updateTokenHistoryBySmartContract: ', e.message);
      }
      Logger.log('tokenName after tokenURI function:', tokenName);
    }
    if (tokenName === "" && tokenType === "TNT-20") {
      Logger.log(`Failed to fetch total name, skip.`);
      return;
    }
    try {
      const type = 7, isEqualType = 'true', pageNum = 0, limitNumber = 0, reverse = false;
      const txList = await accountTxDao.getListAsync(address, type, isEqualType, pageNum, limitNumber, reverse);
      let txHashes = txList.map(tx => tx.hash);
      const tokenList = await tokenDao.getInfoListByAddressAndTokenIdAsync(address, null, pageNum, limitNumber);
      let tokenTxSet = new Set(tokenList.map(info => info.hash));
      txHashes = txHashes.concat([...tokenTxSet]);
      const txs = await transactionDao.getTransactionsByPkAsync(txHashes);
      const tokenArr = [];
      const insertList = [];
      for (let tx of txs) {
        let logs = get(tx, 'receipt.Logs');
        logs = JSON.parse(JSON.stringify(logs));
        logs = logs.map(obj => {
          obj.data = getHex(obj.data)
          return obj;
        })
        logs = decodeLogsByAbi(logs, abi);
        for (let [i, log] of logs.entries()) {
          if (get(log, 'topics[0]') !== EventHashMap.TRANSFER) {
            continue;
          }
          const contractAddress = get(log, 'address');
          // If log.address !== sc.address, it will be handled in verification of contract log.address
          if (contractAddress !== address) {
            continue;
          }
          const id = tx.hash + i;
          const tokenId = get(log, 'decode.result.tokenId');
          const value = tokenId != null ? 1 : get(log, 'decode.result[2]');
          const newToken = {
            hash: tx.hash.toLowerCase(),
            from: get(log, 'decode.result[0]').toLowerCase(),
            to: get(log, 'decode.result[1]').toLowerCase(),
            token_id: tokenId,
            value,
            name: tokenName,
            type: tokenType,
            timestamp: tx.timestamp,
            contract_address: contractAddress
          }
          tokenArr.push(newToken);
          insertList.push(tokenDao.upsertAsync(id, newToken))
        }
      }
      await updateTokenSummary(tokenArr, address, tokenName, tokenType, abi, tokenSummaryDao, tokenHolderDao);
      await Promise.all(insertList);
    } catch (e) {
      Logger.log(`Error occurs when handling the smart contract: ${address}, Error: ${e.message}`);
    }
    Logger.log(`Complete update smart contract #${i}/${smartContractIds.length} Add:${address}. Takes ${(+new Date() - startTime) / 1000} seconds`);
    Logger.log('-----------------------------------------------------------------------------------');
  }
  Logger.log('Mission Completed!');

}

function decodeLogsByAbi(logs, abi) {
  const iface = new ethers.utils.Interface(abi || []);
  return logs.map(log => {
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

async function _getTNT20Name(address, abi) {
  const arr = abi.filter(obj => obj.name == "name" && obj.type === 'function');
  if (arr.length === 0) return "";
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
    let url = abiCoder.decode(outputTypes, outputValues)[0];
    return url;
  } catch (e) {
    Logger.log('Error occurs in getTNT20Name:', e.message);
    return "";
  }
}

async function _getTNT721Name(address, abi) {
  const arr = abi.filter(obj => obj.name == "tokenURI" && obj.type === 'function');
  if (arr.length === 0) return "";
  const functionData = arr[0];
  const inputValues = [0]

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
          let name = get(res, 'data.name');
          return name.replace(/\(Edition #(.*)\)/, "");
        }).catch(e => {
          Logger.log('error occurs in fetch url:', e.message)
          return "";
        })
    }
  } catch (e) {
    Logger.log('Error occurs in getTNT721Name:', e.message);
    return "";
  }
}

async function updateTokenSummary(tokenArr, address, tokenName, tokenType, abi, tokenSummaryDao, tokenHolderDao) {
  Logger.log(`In updateTokenSummary of address:${address}`)
  const tokenInfo = {
    _id: address,
    holders: { total: 0 },
    max_total_supply: 0,
    total_transfers: 0,
    name: tokenName,
    type: tokenType
  };
  try {
    tokenInfo.max_total_supply = await getMaxTotalSupply(address, abi);
    if (!tokenInfo.max_total_supply) {
      Logger.log(`Failed to fetch total supply, skip.`);
      return;
    }
  } catch (e) {
    Logger.log('Error met when get max total supply in updateTokenSummary: ', e.message);
  }
  // Collect balance changes and store in holderMap
  /* holderMap = {
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
  }*/
  const holders = {};
  for (let token of tokenArr) {
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
      if (holders[key][from] == 0) delete holders[key][from];
      if (Object.keys(holders[key]).length == 0) delete holders[key];
    }
    if (to !== ZeroAddress) {
      if (holders[key] === undefined) {
        holders[key] = { [to]: new BigNumber(value).toFixed(0) }
      } else if (holders[key][to] === undefined) {
        holders[key][to] = new BigNumber(value).toFixed(0);
      } else {
        holders[key][to] = new BigNumber(holders[key][to]).plus(value).toFixed(0);
      }
      if (holders[key][to] == 0) delete holders[key][to];
      if (Object.keys(holders[key]).length == 0) delete holders[key];
    }
    tokenInfo.total_transfers++;
  }
  const updateAsyncList = [];
  const totalHolderSet = new Set();
  for (let key of Object.keys(holders)) {
    const map = holders[`${key}`];
    const tokenId = key === 'TNT20' ? null : key;
    let newHolderList = Object.keys(map);

    newHolderList.forEach(account => {
      totalHolderSet.add(account);
      updateAsyncList.push(tokenHolderDao.insertAsync({
        contract_address: address,
        holder: account,
        amount: map[`${account}`],
        token_id: tokenId
      }))
    })
    // Update token summary holders
    if (key === 'TNT20') {
      tokenInfo.holders.total = newHolderList.length;
    } else {
      tokenInfo.holders[`${tokenId}`] = newHolderList.length;
    }
  }
  if (tokenType === 'TNT-721') {
    tokenInfo.holders.total = totalHolderSet.size;
  }
  updateAsyncList.push(tokenSummaryDao.upsertAsync({ ...tokenInfo }));
  return Promise.all(updateAsyncList);
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
    Logger.log('Error occurs in getMaxTotalSupply:', e.message);
    return 0;
  }
}

async function getDecimals(address, abi) {
  const arr = abi.filter(obj => obj.name == "decimals" && obj.type === 'function');
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
    let decimals = abiCoder.decode(outputTypes, outputValues)[0];
    Logger.log(`decimals: ${decimals}, typeof: ${typeof decimals}`);
    return decimals;
  } catch (e) {
    Logger.log('error occurs:', e.message);
    return 0;
  }
}