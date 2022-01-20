const { get } = require('lodash');
const { EventHashMap, ZeroAddress } = require('../helper/constants');
var Logger = require('../helper/logger');
var { checkTnt721, checkTnt20 } = require('../helper/smart-contract');
var { getHex } = require('../helper/utils');
var { ethers } = require("ethers");

var Theta = require('../libs/Theta');
var ThetaJS = require('../libs/thetajs.esm');
var smartContractApi = require('../api/smart-contract-api');

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

exports.Execute = async function () {
  let smartContractIds = [], tokenSummaryIds = [], tokenSummarySet;
  try {
    smartContractIds = await smartContractDao.getAllIdsAsync({ source_code: { $ne: "" } });
    console.log('smartContractIds:', smartContractIds);
    tokenSummaryIds = await tokenSummaryDao.getAllIdsAsync();
    console.log('tokenSummaryIds:', tokenSummaryIds);
    tokenSummarySet = new Set(tokenSummaryIds);
  } catch (e) {
    Logger.log('Error occurs in get get ids:', e.message);
  }
  for (let i = 0; i < smartContractIds.length; i++) {
    const address = smartContractIds[i];
    const startTime = +new Date();
    console.log(`Processing smart contract #${i}/${smartContractIds.length} with address:${address}.`);
    const abi;
    try {
      abi = await smartContractDao.getAbiAsync(address);
    } catch (e) {
      Logger.log(`Error occurs in get abi by address:${address}. Error: ${e.message}`);
    }
    if (!abi) {
      console.log(`Smart contract #${i}/${smartContractIds.length} Add:${address} doesn't have abi field, skip.`);
      continue;
    }

    const isTnt721 = checkTnt721(abi);
    const isTnt20 = checkTnt20(abi);
    if (!isTnt721 && !isTnt20) {
      console.log(`Smart contract #${i}/${smartContractIds.length} Add:${address} is not TNT-721 or TNT-20, skip.`);
      continue;
    }

    if (tokenSummarySet.has(address)) {
      console.log(`Smart contract #${i}/${smartContractIds.length} Add:${address} is been updated in tokenSummaryDao, skip.`);
      continue;
    }
    const tokenType = isTnt721 ? 'TNT-721' : 'TNT-20';
    console.log('Token type:', tokenType);
    let tokenName = ""
    try {
      tokenName = isTnt20 ? await _getTNT20Name(address, abi) : await _getTNT721Name(address, abi);
      console.log('Fetched token name:', tokenName);
    } catch (e) {
      console.log('Error in fetch token name in updateTokenHistoryBySmartContract: ', e.message);
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
            from: get(log, 'decode.result.from').toLowerCase(),
            to: get(log, 'decode.result.to').toLowerCase(),
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
      console.log(`Error occurs when handling the smart contract: ${address}, Error: ${e.message}`);
    }
    console.log(`Complete update smart contract #${i}/${smartContractIds.length} Add:${address}. Takes ${(+new Date() - startTime) / 1000} seconds`);
  }

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
    console.log('error occurs:', e.message);
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
          console.log('error occurs in fetch url:', e.message)
          return "";
        })
    }
  } catch (e) {
    console.log('error occurs:', e.message);
    return "";
  }
}

async function updateTokenSummary(tokenArr, address, tokenName, tokenType, abi, tokenSummaryDao, tokenHolderDao) {
  console.log(`In updateTokenSummary of address:${address}`)
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
  } catch (e) {
    console.log('Error met when get max total supply in updateTokenSummary: ', e.message);
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
    console.log('error occurs:', e.message);
    return 0;
  }
}