exports.updateVcp = async function (candidate, vcpDao) {
  const holder = candidate.Holder;
  const stakes = candidate.Stakes;
  const isExist = await vcpDao.checkVcpAsync(holder);
  const vpc = isExist ? await vcpDao.getVcpAsync(holder) : null;
  // console.log('vpc:', vpc)
  let stakeList = vpc ? vpc.stakes : {};
  // console.log(stakeList)
  stakes.forEach(stake => {
    // console.log(stake)
    if (!stakeList[stake.Source]) {
      stakeList[stake.Source] = stake.Amount;
    } else {
      if (!stake.Withdrawn) {
        stakeList[stake.Source] += stake.Amount;
      } else {
        stakeList[stake.Source] -= stake.Amount;
        if (stakeList[stake.Source] < 0) {
          console.log(`stake amount is less than 0, something wrong.`);
        }
      }
    }
  });
  const vcpInfo = {
    'source': holder,
    'stakes': stakeList
  }
  await vcpDao.upsertVcpAsync(vcpInfo);
}