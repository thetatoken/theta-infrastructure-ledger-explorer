var Logger = require('../helper/logger');

let transactionDao = null;
let txHistoryDao = null;

exports.Initialize = function (transactionDaoInstance, txHistoryDaoInstance) {
  transactionDao = transactionDaoInstance;
  txHistoryDao = txHistoryDaoInstance;
}

exports.Execute = function () {
  txHistoryDao.getAllTxHistoryAsync()
    .then(async res => {
      txHistoryDao.removeAllAsync();
      res.sort((a, b) => { return a.timestamp - b.timestamp }).shift();
      const num = await transactionDao.getTotalNumberByHourAsync(24);
      res.push({ timestamp: (new Date().getTime() / 1000).toFixed(), number: num });
      res.forEach(info => {
        const data = { timestamp: info.timestamp, number: info.number };
        txHistoryDao.insertAsync(data);
      })
    }).catch(async err => {
      Logger.log('err:', err)
      if (err) {
        if (err.message.includes('NOT_FOUND')) {
          let records = []
          let tmp = 0;
          for (let i = 0; i < 14; i++) {
            const num = await transactionDao.getTotalNumberByHourAsync(24 * (i + 1))
            txHistoryDao.insertAsync({ timestamp: (new Date().getTime() / 1000 - 60 * 60 * 24 * i).toFixed(), number: num - tmp });
            // records.push({ timestamp: (new Date().getTime() / 1000 - 60 * 60 * 24 * i).toFixed(), number: num - tmp })
            tmp = num;
          }
          Logger.log(records);
        }
      }
    })
}