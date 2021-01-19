let activeActDao = null;
let accountTxDao = null;

exports.Initialize = function (accountTxDaoInstance, activeActDaoInstance) {
  accountTxDao = accountTxDaoInstance;
  activeActDao = activeActDaoInstance;
}

exports.Execute = function () {
  let endTime = (new Date().getTime() / 1000).toFixed();
  let startTime = endTime - 60 * 60 * 24;
  accountTxDao.getAllRecordsByTimeAsync(startTime.toString(), endTime.toString())
    .then(async res => {
      const accountSet = new Set();
      res.forEach(o => {
        if (!accountSet.has(o.acct)) accountSet.add(o.acct);
      })
      let amount = accountSet.size;
      await activeActDao.insertAsync({ amount, timestamp: endTime });
    }).catch(async err => {
      console.log('error from getAllRecordsByTime:', err);
    })
}