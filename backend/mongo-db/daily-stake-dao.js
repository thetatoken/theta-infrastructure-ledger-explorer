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

  // getRecordByTypeAndTimestamp(type, timestamp, callback) {
  //   const queryObject = { type: type, timestamp: timestamp }
  //   this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  // }
}