var get = require('lodash/get');
var { ZeroAddress, ZeroTxAddress } = require('./constants');
var { getHex } = require('./utils');
var { ethers } = require("ethers");
var smartContractApi = require('../api/smart-contract-api');

exports.updateToken = async function (tx, smartContractDao, tokenDao, tokenSummaryDao) {
  let contractAddress = get(tx, 'receipt.ContractAddress');
  if (contractAddress === undefined || contractAddress === ZeroTxAddress) {
    return;
  }

  const abi = await smartContractDao.getAbiAsync(contractAddress);
  if (!abi) {
    return;
  }

  const isTnt721 = checkTnt721(abi);
  const isTnt20 = checkTnt20(abi);
  if (!isTnt721 && !isTnt20) {
    return;
  }

  let logs = get(tx, 'receipt.Logs');
  logs = JSON.parse(JSON.stringify(logs));
  logs = logs.map(obj => {
    obj.data = getHex(obj.data);
    return obj;
  })
  logs = decodeLogs(logs, abi);
  const arr = abi.filter(obj => (obj.name == "tokenURI" && obj.type === 'function')
    || (obj.name === 'Transfer' && obj.type === 'event'));
  const tokenArr = [];
  if (arr.length === 0) return;
  let tokenName = "";
  logs.forEach(async (log, i) => {
    const tokenId = get(log, 'decode.result.tokenId');
    const eventName = get(log, 'decode.eventName');
    if (tokenId === undefined && eventName !== 'Transfer') {
      return;
    }
    if (tokenName === "") {
      tokenName = isTnt721 ? await _getTNT721Name(log, abi) : await _getTNT20Name(log, abi);
    }
    tokenArr.push({
      id: tx.hash + i,
      from: get(log, 'decode.result.from'),
      to: get(log, 'decode.result.to'),
      tokenId: get(log, 'decode.result.tokenId'),
      value: get(log, 'decode.result.value'),
    })
  })

  const insertList = [];
  tokenArr.forEach(token => {
    const newToken = {
      _id: token.id,
      hash: tx.hash,
      name: tokenName,
      type: isTnt20 ? 'TNT-20' : 'TNT-721',
      token_id: token.tokenId,
      from: token.from,
      to: token.to,
      value: token.value,
      timestamp: tx.timestamp,
      contract_address: contractAddress
      //TODOs: add method field from decoded data
    }
    insertList.push(checkAndInsertToken(newToken, tokenDao))
  })
  await updateTokenSummary(contractAddress, tokenArr, tokenName, tokenSummaryDao);
  return Promise.all(insertList);
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
    console.log('url:', url);
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
          console.log('error occurs in fetch url:', e)
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

async function updateTokenSummary(address, tokenArr, tokenName, tokenSummaryDao) {
  console.log('In updateTokenSummary')
  let tokenInfo = {
    _id: address,
    holders: {},
    max_total_supply: 0,
    total_transfers: 0,
    name: tokenName
  };
  try {
    tokenInfo = await tokenSummaryDao.getInfoByAddressAsync(address)
    console.log(tokenInfo)
  } catch (e) {
    console.log('error:', e);
  }
  let holders = tokenInfo.holders;
  tokenArr.forEach(token => {
    let from = token.from;
    let to = token.to;
    const key = token.tokenId != null ? address + token.tokenId : address;
    let value = token.value || 1;
    if (from !== ZeroAddress) {
      // holders[from][key] -= value;
      if (holders[from] === undefined) {
        holders[from] = { [key]: -value }
      } else if (holders[from][key] === undefined) {
        holders[from][key] = -value;
      } else {
        holders[from][key] -= value;
      }
      if (holders[from][key] === 0) delete holders[from][key];
      if (Object.keys(holders[from]).length === 0) delete holders[from]
    }
    if (holders[to] === undefined) {
      holders[to] = { [key]: value }
    } else if (holders[to][key] === undefined) {
      holders[to][key] = value;
    } else {
      holders[to][key] += value;
    }
    if (holders[to][key] === 0) delete holders[to][key];
    if (Object.keys(holders[to]).length === 0) delete holders[to];
  })
  tokenInfo.total_transfers++;
  await tokenSummaryDao.upsertAsync(tokenInfo);
}