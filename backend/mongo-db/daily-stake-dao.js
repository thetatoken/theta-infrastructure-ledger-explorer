//------------------------------------------------------------------------------
//  DAO for daily stake
//  Require index: `db.dailyStake.createIndex({type:1, timestamp:-1})`
//  Require index: `db.dailyStake.createIndex({type:1, height:-1})`
//------------------------------------------------------------------------------

module.exports = class DailyStakeDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'dailyStake';
  }

  insert(info, callback) {
    this.client.insert(this.collection, info, callback);
  }

  getRecordByTypeAndHeight(type, height, callback) {
    const queryObject = { type: type, height: height }
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }

  getRecordByTypeAndTimestamp(type, timestamp, callback) {
    const queryObject = { type: type, timestamp: timestamp }
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }

  getLatestTimestamp(timestamp, callback) {
    console.log('timestamp:', timestamp, typeof timestamp)
    const queryObject = { timestamp: { $lte: timestamp } }
    const sortObject = { 'timestamp': -1 };
    this.client.getRecords(this.collection, queryObject, sortObject, 0, 1, function (err, list) {
      if (list.length === 0) {
        console.log('return in length 0')
        callback(Error(`NOT_FOUND - Stake records before timestamp ${timestamp}`));
      } else if (err) {
        callback(err)
      } else {
        callback(err, list[0].timestamp)
      }
    })
  }
}