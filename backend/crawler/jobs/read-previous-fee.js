var Logger = require('../helper/logger');

var txHelper = require('../helper/transactions');

var progressDao = null;
var blockDao = null;
var transactionDao = null;

exports.Initialize = function (progressDaoInstance, blockDaoInstance, transactionDaoInstance) {
  progressDao = progressDaoInstance;
  blockDao = blockDaoInstance;
  transactionDao = transactionDaoInstance;
}

exports.Execute = async function (network_id, readPreFeeTimer) {
  let height;
  const blockNum = 50;
  try {
    let feeProgressInfo = await progressDao.getFeeProgressAsync();
    height = feeProgressInfo.block_height;
  } catch (e) {
    if (e.message === 'No fee progress record') {
      try {
        const progressInfo = await progressDao.getProgressAsync(network_id);
        height = progressInfo.height;
      } catch (e) {
        height = 0;
      }
    } else {
      Logger.log('Error occurs in get fee:', e)
    }
  }
  Logger.log('height:', height);
  if (height === 0) {
    clearInterval(readPreFeeTimer);
    return;
  }
  try {
    const startHeight = height - blockNum > 0 ? height - blockNum : 1;
    const blockListInfo = await blockDao.getBlocksByRangeAsync(startHeight, height);
    const txHashList = [];
    blockListInfo.forEach(block => {
      txHashList.push(block.txs.map(tx => tx.hash))
    })
    const txsInfoList = await transactionDao.getTransactionsByPkAsync(txHashList);
    await txHelper.updateFees(txsInfoList, progressDao)
    await progressDao.upsertFeeProgressAsync(startHeight - 1);
  } catch (e) {
    Logger.log('Error occurs while updating fee and fee progress:', e.message);
  }
}