//------------------------------------------------------------------------------
//  DAO for txHistory
//------------------------------------------------------------------------------

module.exports = class TxHistoryDAO {

  constructor(execDir, client) {
    this.client = client;
    this.txHistoryInfoCollection = 'txHistory';
  }

  insert(txHistoryInfo, callback) {
    this.client.insert(this.txHistoryInfoCollection, txHistoryInfo, callback);
  }

  getAllTxHistory(callback) {
    this.client.findAll(this.txHistoryInfoCollection, function (error, recordList) {
      if (error) {
        console.log('TX history dao getAllTxHistory ERR - ', error, height);
        callback(error);
      } else if (!recordList || !recordList.length) {
        callback(Error('NOT_FOUND - Transaction History.'));
      } else {
        callback(error, recordList)
      }
    })
  }

  removeAll(callback) {
    this.client.remove(this.txHistoryInfoCollection, function (err, res) {
      if (err) {
        console.log('TX history dao removeAll ERR - ', err, height);
        callback(err);
      }
      callback(err, res);
    })
  }
}