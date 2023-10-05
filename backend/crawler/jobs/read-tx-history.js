var Logger = require('../helper/logger');

let transactionDao = null;
let txHistoryDao = null;

const MAX_RECORD_DAYS = 365;
exports.Initialize = function (transactionDaoInstance, txHistoryDaoInstance) {
  transactionDao = transactionDaoInstance;
  txHistoryDao = txHistoryDaoInstance;
}

exports.Execute = function () {
  txHistoryDao.getAllTxHistoryAsync()
    .then(async res => {
      await txHistoryDao.removeAllAsync();
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
          for (let i = 0; i < MAX_RECORD_DAYS; i++) {
            const num = await transactionDao.getTotalNumberByHourAsync(24 * (i + 1))
            txHistoryDao.insertAsync({ timestamp: (new Date().getTime() / 1000 - 60 * 60 * 24 * i).toFixed(), number: num - tmp });
            tmp = num;
          }
          Logger.log(records);
        }
      }
    })
}

exports.Check = function () {
  const iniTime = new Date().setUTCHours(7, 0, 0, 0) > new Date().getTime() ?
    new Date().setUTCHours(7, 0, 0, 0) : new Date().setUTCHours(7, 0, 0, 0);
  txHistoryDao.getAllTxHistoryAsync()
    .then(async res => {
      console.log('res length:', res.length);
      if (res.length === MAX_RECORD_DAYS) return;
      Logger.log(`Tx History less than ${MAX_RECORD_DAYS} reocrds. Reset Records.`);
      await txHistoryDao.removeAllAsync();
      let tmp = 0;
      for (let i = 0; i < MAX_RECORD_DAYS; i++) {
        const num = await transactionDao.getTotalNumberByHourAsync(24 * (i + 1))
        txHistoryDao.insertAsync({ timestamp: (iniTime / 1000 - 60 * 60 * 24 * i).toFixed(), number: num - tmp });
        tmp = num;
      }
      Logger.log(`Tx History Reset Records progress done.`);
    }).catch(async err => {
      Logger.log('Tx history check err:', err)
      if (err) {
        if (err.message.includes('NOT_FOUND')) {
          let tmp = 0;
          for (let i = 0; i < MAX_RECORD_DAYS; i++) {
            const num = await transactionDao.getTotalNumberByHourAsync(24 * (i + 1))
            txHistoryDao.insertAsync({ timestamp: (iniTime / 1000 - 60 * 60 * 24 * i).toFixed(), number: num - tmp });
            tmp = num;
          }
        }
      }
    })
}