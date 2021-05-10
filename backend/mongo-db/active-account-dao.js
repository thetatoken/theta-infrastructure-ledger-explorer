//------------------------------------------------------------------------------
//  DAO for active account history
//  Require index: `db.activeAct.createIndex({timestamp:-1})`
//------------------------------------------------------------------------------

module.exports = class ActiveAccountDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'activeAct';
  }

  insert(data, callback) {
    this.client.insert(this.collection, data, callback);
  }
  getLatestRecords(limitNumber = 1, callback) {
    const queryObject = { timestamp: -1 };
    this.client.getTopRecords(this.collection, queryObject, limitNumber, function (error, recordList) {
      var activeActList = []
      if (!recordList || recordList.length === 0) {
        callback(Error('NO_RECORD'));
        return;
      }
      for (var i = 0; i < recordList.length; i++) {
        let activeAct = {};
        activeAct.amount = recordList[i].amount;
        activeAct.timestamp = recordList[i].timestamp;
        activeActList.push(activeAct)
      }
      callback(error, activeActList)
    })
  }
  getInfoListByTime(start, end, callback) {
    const queryObject = { timestamp: { $gte: start, $lte: end } };
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }
}