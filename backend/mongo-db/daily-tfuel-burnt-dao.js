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

  getRecordByTimestamp(timestamp, callback) {
    const queryObject = { timestamp: timestamp }
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }

  getLatestTimestamp(timestamp, callback) {
    const queryObject = { timestamp: { $lte: timestamp } }
    const sortObject = { 'timestamp': -1 };
    this.client.getRecords(this.collection, queryObject, sortObject, 0, 1, function (err, list) {
      if (list.length === 0) {
        callback(Error(`NOT_FOUND - Daily TFuel Burnt before timestamp ${timestamp}`));
      } else if (err) {
        callback(err)
      } else {
        callback(err, list[0].timestamp)
      }
    })
  }
}