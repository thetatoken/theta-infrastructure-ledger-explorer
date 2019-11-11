exports.updateVcp = async function (candidate, vcpDao) {
  const holder = candidate.Holder;
  const stakes = candidate.Stakes;
  const isExist = await vcpDao.checkVcpAsync(holder);
  const vpc = isExist ? await vcpDao.getVcpAsync(holder) : null;
  let stakeList = {};
  stakes.forEach(stake => {
    if (!stakeList[stake.source]) {
      stakeList[stake.source] = stake.amount;
    } else {
      if (!stake.withdrawn) {
        stakeList[stake.source] = stake.amount;
      } else {
        stakeList[stake.source] = null;
      }
    }
  });
  const vcpInfo = {
    'source': holder,
    'stakes': stakeList
  }
  await vcpDao.upsertVcpAsync(vcpInfo);
}