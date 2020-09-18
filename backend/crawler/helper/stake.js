var helper = require('./utils');

exports.updateStake = async function (candidate, type, stakeDao) {
  const holder = candidate.Holder;
  const stakes = candidate.Stakes;
  let insertList = [];
  stakes.forEach(stake => {
    const stakeInfo = {
      'type': type,
      'holder': holder,
      'source': stake.source,
      'amount': stake.amount,
      'withdrawn': stake.withdrawn,
      'return_height': stake.return_height
    }
    insertList.push(stakeDao.insertAsync(stakeInfo));
  });
  await Promise.all(insertList);
}

exports.updateTotalStake = function (totalStake, progressDao) {
  let total = 0;
  let holders = new Set();
  totalStake.vcp.forEach(vcpPair => {
    vcpPair.Vcp.SortedCandidates.forEach(candidate => {
      holders.add(candidate.Holder)
      candidate.Stakes.forEach(stake => {
        total = helper.sumCoin(total, stake.amount)
      })
    })
  })
  totalStake.gcp.forEach(gcpPair => {
    gcpPair.Gcp.SortedGuardians.forEach(candidate => {
      holders.add(candidate.Holder)
      candidate.Stakes.forEach(stake => {
        total = helper.sumCoin(total, stake.amount)
      })
    })
  })
  progressDao.upsertStakeProgressAsync(total.toFixed(), holders.size);
}