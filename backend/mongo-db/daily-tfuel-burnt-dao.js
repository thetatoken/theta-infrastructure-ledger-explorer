//------------------------------------------------------------------------------
//  DAO for daily tfuel burnt
//  Require index: `db.dailyTfuelBurnt.createIndex({timestamp:-1})`
//------------------------------------------------------------------------------

module.exports = class DailyTfuelBurntDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'dailyTfuelBurnt';
  }

  insert(info, callback) {
    this.client.insert(this.collection, info, callback);
  }
  
  getLatestRecord(callback) {
    const queryObject = { timestamp: -1 };
    this.client.getTopRecords(this.collection, queryObject, 1, function (error, recordList) {
      if (recordList.length === 0) {
        callback(Error('NO_RECORD'));
        return;
      }
      let result = {};
      result.timestamp = recordList[0].timestamp;
      result.totalTfuelBurnt = recordList[0].totalTfuelBurnt;
      result.dailyTfuelBurnt = recordList[0].dailyTfuelBurnt;
      callback(error, result)
    })
  }
}