exports.updateVcp = async function (candidate, vcpDao) {
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