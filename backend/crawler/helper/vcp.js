exports.updateVcp = async function (candidate, vcpDao) {
  await vcpDao.removeAllAsync();
  const holder = candidate.Holder;
  const stakes = candidate.Stakes;
  let insertList = [];
  stakes.forEach(stake => {
    if (!stake.withdrawn) {
      const vcpInfo = {
        'holder': holder,
        'source': stake.source,
        'amount': stake.amount
      }
      insertList.push(vcpDao.insertAsync(vcpInfo));
    }
  });
  await Promise.all(insertList);
}