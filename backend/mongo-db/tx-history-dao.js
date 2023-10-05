//------------------------------------------------------------------------------
//  DAO for txHistory
//------------------------------------------------------------------------------

module.exports = class TxHistoryDAO {

  constructor(execDir, client) {
    this.client = client;
    this.txHistoryInfoCollection = 'txHistory';
  }

  insert(txHistoryInfo, callback) {
    txHistoryInfo._id = txHistoryInfo.timestamp;
    this.client.insert(this.txHistoryInfoCollection, txHistoryInfo, callback);
  }

  upsert(txHistoryInfo, callback) {
    txHistoryInfo._id = txHistoryInfo.timestamp;
    const queryObject = { '_id': txHistoryInfo._id };
    this.client.upsert(this.txHistoryInfoCollection, queryObject, txHistoryInfo, callback);
  }

  getTxHistory(limit, callback) {
    const sortObject = { 'timestamp': -1 };
    this.client.getRecords(this.txHistoryInfoCollection, {}, sortObject, 0, limit, function (error, recordList) {
      if (error) {
        console.log('TX history dao getAllTxHistory ERR - ', error);
        callback(error);
      } else if (!recordList || !recordList.length) {
        callback(Error('NOT_FOUND - Transaction History.'));
      } else {
        callback(error, recordList)
      }
    });
  }

  getAllTxHistory(callback) {
    this.client.findAll(this.txHistoryInfoCollection, function (error, recordList) {
      if (error) {
        console.log('TX history dao getAllTxHistory ERR - ', error);
        callback(error);
      } else if (!recordList || !recordList.length) {
        callback(Error('NOT_FOUND - Transaction History.'));
      } else {
        callback(error, recordList)
      }
    })
  }

  removeRecordsByTs(tsList, callback) {
    const queryObject = { timestamp: { $in: tsList } };
    this.client.remove(this.txHistoryInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('TX history dao removeRecordsByTs ERR - ', err, tsList);
        callback(err);
      }
      callback(err, res);
    })
  }

  removeAll(callback) {
    this.client.remove(this.txHistoryInfoCollection, function (err, res) {
      if (err) {
        console.log('TX history dao removeAll ERR - ', err);
        callback(err);
      }
      callback(err, res);
    })
  }
}