var { getHex } = require('./utils');
var { ethers } = require("ethers");
var Theta = require('../libs/Theta');
var ThetaJS = require('../libs/thetajs.esm');
var smartContractApi = require('../api/smart-contract-api');
var get = require('lodash/get');
var map = require('lodash/map');
const { default: axios } = require('axios');
var BigNumber = require('bignumber.js');

const ZeroAddress = '0x0000000000000000000000000000000000000000';
const EventHashMap = {
  TRANSFER: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
}

exports.updateTokenHistoryBySmartContract = async function (sc, transactionDao, accountTxDao, tokenDao, tokenSummaryDao, tokenHolderDao) {
  const abi = sc.abi;
  if (!abi) {
    return;
  }

  const isTnt721 = checkTnt721(abi);
  const isTnt20 = checkTnt20(abi);
  if (!isTnt721 && !isTnt20) {
    return;
  }
  const address = sc.address;
  const tokenType = isTnt721 ? 'TNT-721' : 'TNT-20';
  let tokenName = ""
  try {
    tokenName = await _getTNT20Name(address, abi);
  } catch (e) {
    console.log('Error in fetch token name by name function in updateTokenHistoryBySmartContract: ', e.message);
  }
  console.log('tokenName after name function:', tokenName);
  if (tokenName === "" && isTnt721) {
    try {
      tokenName = await _getTNT721Name(address, abi);
    } catch (e) {
      console.log('Error in fetch TNT-721 token name by tokenURI in updateTokenHistoryBySmartContract: ', e.message);
    }
    console.log('tokenName after tokenURI function:', tokenName);
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
      logs = decodeLogs(logs, abi);
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
    return Promise.all(insertList);
  } catch (e) {
    console.log('Something wrong happened during the updateTokenHistoryByAddress process:', e)
  }

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

function decodeLogs(logs, abi) {
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
  const arr = abi.filter(obj => obj.name == "contractURI" && obj.type === 'function');
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
          return name || "";
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
  console.log('In updateTokenSummary')
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
    if (tokenType === 'TNT-20') {
      tokenInfo.decimals = await getDecimals(address, abi);
      tokenInfo.symbol = await getSymbol(address, abi);
    }
  } catch (e) {
    console.log('Error met when get max total supply and decimals in updateTokenSummary: ', e.message);
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
    return decimals.toString();
  } catch (e) {
    console.log('error occurs:', e.message);
    return 0;
  }
}

async function getSymbol(address, abi) {
  const arr = abi.filter(obj => obj.name == "symbol" && obj.type === 'function');
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
    let symbol = abiCoder.decode(outputTypes, outputValues)[0];
    return symbol;
  } catch (e) {
    console.log('error occurs:', e.message);
    return "";
  }
}