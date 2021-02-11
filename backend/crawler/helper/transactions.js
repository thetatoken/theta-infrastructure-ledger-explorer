var helper = require('./utils');

exports.getBriefTxs = function (txs) {
  const res = []
  txs.forEach(tx => {
    let fee;
    if (tx.type === 7) {
      const gasUsed = tx.receipt.GasUsed;
      const gasPrice = tx.raw.gas_price;
      fee = {
        'thetawei': '0',
        'tfuelwei': helper.timeCoin(gasUsed, gasPrice)
      }
    } else {
      fee = tx.raw.fee || null;
    }
    tx = {
      hash: tx.hash,
      type: tx.type,
      raw: fee ? {
        fee: fee
      } : null
    }
    res.push(tx);
  });
  return res;
}

exports.updateFees = async function (transactions, progressDao) {
  let fee;
  try {
    const response = await progressDao.getFeeAsync();
    fee = response.total_fee;
  } catch (e) {
    if (e.message === 'No fee record') {
      fee = 0;
    } else {
      console.log('Error occurs while updating fees:', e.message);
    }
  }
  let updatedFee = transactions.reduce((pre, tx) => {
    if (tx.type === 7) {
      const gasUsed = tx.receipt.GasUsed;
      const gasPrice = tx.data.gas_price;
      return helper.sumCoin(pre, helper.timeCoin(gasUsed, gasPrice));
    } else if (tx.type != null) {
      let tfuelwei = tx.data && tx.data.fee ? tx.data.fee.tfuelwei : 0;
      return helper.sumCoin(pre, tfuelwei);
    } else {
      return pre;
    }
  }, fee)
  await progressDao.upsertFeeAsync(updatedFee.toString());
}