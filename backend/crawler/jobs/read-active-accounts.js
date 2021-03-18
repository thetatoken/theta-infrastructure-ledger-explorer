let activeActDao = null;
let accountTxDao = null;

exports.Initialize = function (dailyAccountDaoInstance, activeActDaoInstance) {
  dailyAccountDao = dailyAccountDaoInstance;
  activeActDao = activeActDaoInstance;
}

exports.Execute = function () {
  let timestamp = (new Date().getTime() / 1000).toFixed();
  dailyAccountDao.getTotalNumberAsync()
    .then(async res => {
      await activeActDao.insertAsync({ amount: res, timestamp });
      await dailyAccountDao.removeAllAsync();
    }).catch(async err => {
      console.log('error from getTotalNumber:', err);
    })
}