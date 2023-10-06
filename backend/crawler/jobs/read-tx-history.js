var Logger = require('../helper/logger');

let transactionDao = null;
let txHistoryDao = null;

const MAX_RECORD_DAYS = 365;

let keyCache = new Set();
exports.Initialize = function (transactionDaoInstance, txHistoryDaoInstance) {
  transactionDao = transactionDaoInstance;
  txHistoryDao = txHistoryDaoInstance;
}

exports.Execute = async function () {
  const iniTime = new Date().setUTCHours(7, 0, 0, 0) > new Date().getTime() ?
    new Date().setUTCHours(7, 0, 0, 0) : new Date().setUTCHours(7, 0, 0, 0);
  console.log('Execute iniTime:', iniTime)
  try {
    if (keyCache.size === 0) {
      let res = await txHistoryDao.getAllTxHistoryAsync()
      keyCache = new Set(res.map(obj => obj.timestamp))
    }
    let minTs = Math.min(...keyCache).toFixed();
    keyCache.delete(minTs);
    await txHistoryDao.removeRecordsByIdAsync([minTs]);
    const endTime = iniTime / 1000;
    const startTime = endTime - 60 * 60 * 24;
    const key = endTime.toFixed();
    const num = await transactionDao.getTotalNumberByTimeRangeAsync(startTime, endTime)
    await txHistoryDao.upsertAsync({ timestamp: key, number: num })
    keyCache.add(key)
    console.log('Removed key:', minTs, typeof minTs)
    console.log('Added key:', key)
  } catch (err) {
    Logger.log('Tx history check err:', err)
    if (err) {
      if (err.message.includes('NOT_FOUND')) {
        keyCache = new Set();
        let endTime = iniTime / 1000;
        for (let i = 0; i < MAX_RECORD_DAYS; i++) {
          const key = endTime.toFixed();
          let startTime = endTime - 60 * 60 * 24;
          const num = await transactionDao.getTotalNumberByTimeRangeAsync(startTime, endTime)
          await txHistoryDao.upsertAsync({ timestamp: key, number: num })
          keyCache.add(key)
          endTime = startTime;
        }
      }
    }
  }
}

exports.Check = async function () {
  const iniTime = new Date().setUTCHours(7, 0, 0, 0) > new Date().getTime() ?
    new Date().setUTCHours(7, 0, 0, 0) : new Date().setUTCHours(7, 0, 0, 0);
  console.log('iniTime:', (iniTime / 1000 - 60 * 60 * 24 * 0).toFixed())
  let removeList = [];
  try {
    if (keyCache.size === 0) {
      let res = await txHistoryDao.getAllTxHistoryAsync()
      removeList = res.map(obj => obj._id).filter(id => !id.length || id.length >= 24)
      keyCache = new Set(res.map(obj => obj._id).filter(id => id.length && id.length < 24))
    }
    Logger.log(`Tx History records ${keyCache.size + removeList.length}, matched with ${MAX_RECORD_DAYS}? ${keyCache.size + removeList.length === MAX_RECORD_DAYS}`);
    if (keyCache.size + removeList.length === MAX_RECORD_DAYS) return;
    Logger.log(`Tx History records number is ${keyCache.size + removeList.length}, doesn't match with ${MAX_RECORD_DAYS} reocrds. Fixing Records.`);
    const insertList = [];
    const existKeySet = new Set(keyCache);
    let endTime = iniTime / 1000;
    for (let i = 0; i < MAX_RECORD_DAYS; i++) {
      const key = endTime.toFixed();
      let startTime = endTime - 60 * 60 * 24;
      if (existKeySet.has(key)) {
        existKeySet.delete(key)
      } else {
        const num = await transactionDao.getTotalNumberByTimeRangeAsync(startTime, endTime)
        insertList.push({ timestamp: key, number: num })
      }
      endTime = startTime;
    }
    removeList = removeList.concat([...existKeySet]);
    Logger.log('Tx History removeList length:', removeList.length)
    await txHistoryDao.removeRecordsByIdAsync(removeList);
    for (let ts of removeList) {
      keyCache.delete(ts);
    }
    Logger.log('Tx History insertList length:', insertList.length)
    for (let obj of insertList) {
      await txHistoryDao.upsertAsync(obj);
      keyCache.add(obj.timestamp);
    }
    Logger.log(`Tx History Fixing Records progress done.`);
  } catch (err) {
    Logger.log('Tx history check err:', err)
    if (err) {
      if (err.message.includes('NOT_FOUND')) {
        keyCache = new Set();
        let endTime = iniTime / 1000;
        for (let i = 0; i < MAX_RECORD_DAYS; i++) {
          const key = endTime.toFixed();
          let startTime = endTime - 60 * 60 * 24;
          const num = await transactionDao.getTotalNumberByTimeRangeAsync(startTime, endTime)
          await txHistoryDao.upsertAsync({ timestamp: key, number: num })
          keyCache.add(key)
          endTime = startTime;
        }
      }
    }
  }
}