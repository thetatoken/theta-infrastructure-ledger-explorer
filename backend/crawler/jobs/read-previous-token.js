const { get } = require('lodash');
const { EventHashMap } = require('../helper/constants');
var Logger = require('../helper/logger');
var { decodeLogs, checkTnt721, checkAndInsertToken } = require('../helper/smart-contract');

var progressDao = null;
var blockDao = null;
var transactionDao = null;
var accountDao = null;
var accountTxDao = null;
var smartContractDao = null;
var tokenDao = null;
var tokenHolderDao = null;
var tokenSummaryDao = null;

exports.Initialize = function (progressDaoInstance, blockDaoInstance, transactionDaoInstance, accountDaoInstance,
  accountTxDaoInstance, smartContractDaoInstance, tokenDaoInstance, tokenHolderDaoInstance, tokenSummaryDaoInstance) {
  progressDao = progressDaoInstance;
  blockDao = blockDaoInstance;
  transactionDao = transactionDaoInstance;
  accountDao = accountDaoInstance;
  accountTxDao = accountTxDaoInstance;
  smartContractDao = smartContractDaoInstance;
  tokenDao = tokenDaoInstance;
  tokenHolderDao = tokenHolderDaoInstance;
  tokenSummaryDao = tokenSummaryDaoInstance;
}

exports.Execute = async function (networkId, retrieveStartHeight, readPreTokenTimer) {
  if (!retrieveStartHeight) {
    clearInterval(readPreTokenTimer);
    return;
  }
  let height = retrieveStartHeight;
  const blockNum = 200;
  try {
    let tokenProgressInfo = await progressDao.getTokenProgressAsync();
    height = tokenProgressInfo.block_height;
  } catch (e) {
    Logger.log('Error occurs in get fee:', e.message);
  }
  Logger.log('Read previous token height:', height);
  if (height === 0) {
    clearInterval(readPreTokenTimer);
    return;
  }
  try {
    const startHeight = height - blockNum > 0 ? height - blockNum : 1;
    console.log(`startHeight: ${startHeight}, height: ${height}`)
    const blockListInfo = await blockDao.getBlocksByRangeAsync(startHeight, height);
    console.log('blockListInfo:', blockListInfo)
    console.log(blockListInfo[0].txs[0])
    const txHashList = [];
    blockListInfo.forEach(block => {
      txHashList.push(block.txs.filter(tx => tx.type === 7).map(tx => tx.hash))
    })
    console.log('txHashList:', txHashList);
    const txsInfoList = await transactionDao.getTransactionsByPkAsync(txHashList);
    //TODO: update token info
    await updateTokens(txsInfoList, smartContractDao, tokenDao, tokenSummaryDao)
    await progressDao.upsertTokenProgressAsync(startHeight - 1);
  } catch (e) {
    Logger.log('Error occurs while updating fee and fee progress:', e.message);
  }
}


async function updateTokens(txs, smartContractDao, tokenDao, tokenSummaryDao) {
  let infoMap = {};
  const tokenArr = [];
  const insertList = [];
  for (let tx of txs) {
    let addressList = _getOtherContractAddressSet(tx);
    if (addressList.length === 0) {
      return;
    }
    // Generate info map
    for (let address of addressList) {
      if (infoMap[address] !== undefined) continue;
      infoMap[address] = {};
      const abiRes = await smartContractDao.getAbiAsync(address);
      const abi = get(abiRes[0], 'abi');
      if (!abi) {
        infoMap[address].abi = [];
        infoMap[address].type = 'unknown';
      } else {
        infoMap[address].abi = abi;
        infoMap[address].type = checkTnt721(abi) ? 'TNT-721' : checkTnt20(abi) ? 'TNT-20' : 'unknown';
        const tokenInfo = await tokenSummaryDao.getInfoByAddressAsync(address);
        infoMap[address].tokenName = get(tokenInfo, 'tokenName');
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
    logs = decodeLogs(logs, infoMap);
    for (let [i, log] of logs.entries()) {
      switch (get(log, 'topics[0]')) {
        case EventHashMap.TFUEL_SPLIT:
          if (typeof get(log, 'decode') !== "object") {
            log = decodeLogByCommonAbi(log, EventHashMap.TFUEL_SPLIT);
            let sellerInfo = {
              _id: tx.hash.toLowerCase() + i + 'seller',
              hash: tx.hash.toLowerCase(),
              to: get(log, 'decode.result.seller').toLowerCase(),
              value: get(log, 'decode.result.sellerEarning'),
              type: 'TFUEL',
              timestamp: tx.timestamp,
            }
            let platformInfo = {
              _id: tx.hash.toLowerCase() + i + 'platform',
              hash: tx.hash.toLowerCase(),
              to: get(log, 'decode.result.platformFeeRecipient').toLowerCase(),
              value: get(log, 'decode.result.platformFee'),
              type: 'TFUEL',
              timestamp: tx.timestamp,
            }
            tokenArr.push(sellerInfo, platformInfo);
            insertList.push(checkAndInsertToken(sellerInfo, tokenDao), checkAndInsertToken(platformInfo, tokenDao))
          }
          break;
        case EventHashMap.TRANSFER:
          const contractAddress = get(log, 'address');
          // If log.address === tx.receipt.ContractAddress, and the contract has not been verified
          // this record will be hanlded in the contract verification
          if (get(infoMap, `${contractAddress}.type`) === 'unknow' && contractAddress === get(tx, 'receipt.ContractAddress')) {
            continue;
          }
          const tokenId = get(log, 'decode.result.tokenId');
          const value = tokenId !== undefined ? 1 : get(log, 'decode.result[2]');
          const newToken = {
            _id: tx.hash.toLowerCase() + i,
            hash: tx.hash.toLowerCase(),
            from: get(log, 'decode.result.from').toLowerCase(),
            to: get(log, 'decode.result.to').toLowerCase(),
            token_id: tokenId,
            value,
            name: get(infoMap, `${contractAddress}.name`),
            type: get(infoMap, `${contractAddress}.type`),
            timestamp: tx.timestamp,
            contract_address: contractAddress
          }
          tokenArr.push(newToken);
          insertList.push(checkAndInsertToken(newToken, tokenDao))
          break;
        default:
          break;
      }
    }
  }
  console.log('tokenArr:', tokenArr);
  return Promise.all(insertList);
}

function _getOtherContractAddressSet(tx) {
  let logs = get(tx, 'receipt.Logs');
  if (!logs) return [];
  let set = new Set();
  logs.forEach(log => {
    if (get(log, 'topics[0]') === EventHashMap.TRANSFER) {
      const address = get(log, 'address');
      if (address !== undefined && address !== ZeroAddress && address !== get(tx, 'receipt.contractAddress')) {
        set.add(get(log, 'address'))
      }
    }
  })
  return [...set];
}