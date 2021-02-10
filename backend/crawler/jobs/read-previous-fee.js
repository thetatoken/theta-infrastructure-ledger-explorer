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
  try {
    let feeProgressInfo = await progressDao.getFeeProgressAsync();
    console.log('feeProgressInfo:', feeProgressInfo);
    height = feeProgressInfo.block_height;
  } catch (e) {
    if (e.message === 'No fee progress record') {
      const progressInfo = await progressDao.getProgressAsync(network_id);
      height = progressInfo.height;
    } else {
      console.log('Error occurs in get fee:', e)
    }
  }
  console.log('height:', height);
  if (height === 0) {
    clearInterval(readPreFeeTimer);
    return;
  }
  try {
    const blockInfo = await blockDao.getBlockAsync(height);
    const txHashList = blockInfo.txs.map(tx => tx.hash);
    const txsInfoList = await transactionDao.getTransactionsByPkAsync(txHashList);
    await txHelper.updateFees(txsInfoList, progressDao)
    await progressDao.upsertFeeProgressAsync(height - 1);
  } catch (e) {
    console.log('Error occurs while updating fee and fee progress:', e.message);
  }
}