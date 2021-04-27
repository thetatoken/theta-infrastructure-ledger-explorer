//------------------------------------------------------------------------------
//  DAO for active account history
//  Require index: `db.totalAct.createIndex({timestamp:-1})`
//------------------------------------------------------------------------------

module.exports = class TotalAccountDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'totalAct';
  }

  insert(data, callback) {
    this.client.insert(this.collection, data, callback);
  }
  getLatestRecords(limitNumber = 1, callback) {
    const queryObject = { timestamp: -1 };
    this.client.getTopRecords(this.collection, queryObject, limitNumber, function (error, recordList) {
      var totalActList = []
      if (recordList.length === 0) {
        callback(Error('NO_RECORD'));
        return;
      }
      for (var i = 0; i < recordList.length; i++) {
        let totalAct = {};
        totalAct.amount = recordList[i].amount;
        totalAct.timestamp = recordList[i].timestamp;
        totalActList.push(totalAct)
      }
      callback(error, totalActList)
    })
  }
  getInfoListByTime(start, end, callback) {
    const queryObject = { timestamp: { $gte: start, $lte: end } };
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }
}