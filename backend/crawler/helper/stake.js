var helper = require('./utils');

exports.updateStake = async function (candidate, type, stakeDao) {
  const holder = candidate.Holder;
  const stakes = candidate.Stakes;
  let insertList = [];
  stakes.forEach(stake => {
    const stakeInfo = {
      '_id': `${type}_${holder}_${stake.source}`,
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
exports.updateStakes = async function (candidateList, type, stakeDao) {
  console.log('before update stakes:', type)
  await stakeDao.updateStakesAsync(candidateList, type);
  console.log('after update stakes:', type)
}
exports.updateTotalStake = function (totalStake, progressDao) {
  let totalTheta = 0, totalTfuel = 0;
  let thetaHolders = new Set(), tfuelHolders = new Set();
  totalStake.vcp.forEach(vcpPair => {
    vcpPair.Vcp.SortedCandidates.forEach(candidate => {
      thetaHolders.add(candidate.Holder)
      candidate.Stakes.forEach(stake => {
        totalTheta = helper.sumCoin(totalTheta, stake.withdrawn ? 0 : stake.amount)
      })
    })
  })
  totalStake.gcp.forEach(gcpPair => {
    gcpPair.Gcp.SortedGuardians.forEach(candidate => {
      thetaHolders.add(candidate.Holder)
      candidate.Stakes.forEach(stake => {
        totalTheta = helper.sumCoin(totalTheta, stake.withdrawn ? 0 : stake.amount)
      })
    })
  })
  totalStake.eenp.forEach(eenpPair => {
    eenpPair.Eenp.SortedEliteEdgeNodes.forEach(candidate => {
      tfuelHolders.add(candidate.Holder);
      candidate.Stakes.forEach(stake => {
        totalTfuel = helper.sumCoin(totalTfuel, stake.withdrawn ? 0 : stake.amount);
      })
    })
  })
  progressDao.upsertStakeProgressAsync('theta', totalTheta.toFixed(), thetaHolders.size);
  progressDao.upsertStakeProgressAsync('tfuel', totalTfuel.toFixed(), tfuelHolders.size);
}