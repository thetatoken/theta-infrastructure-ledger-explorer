var path = require('path');
//------------------------------------------------------------------------------
//  DAO for stake
//------------------------------------------------------------------------------

module.exports = class stakeDAO {

  constructor(execDir, client) {
    // this.aerospike = require(path.join(execDir, 'node_modules', 'mongodb'));
    this.client = client;
    this.stakeInfoCollection = 'stake';
  }

  insert(stakeInfo, callback) {
    this.client.insert(this.stakeInfoCollection, stakeInfo, callback);
  }

  getAllStakes(callback) {
    this.client.findAll(this.stakeInfoCollection, function (error, recordList) {
      if (error) {
        console.log('ERR - ', error, height);
        // callback(error);
      } else if (!recordList) {
        callback(Error('NOT_FOUND - ' + height));
      } else {
        callback(error, recordList)
      }
    })
  }

  getStakeByAddress(address, callback) {
    const queryHolder = { 'holder': address };
    const querySource = { 'source': address };
    let holderRecords = [];
    let sourceRecords = [];
    const self = this;
    this.client.query(this.stakeInfoCollection, queryHolder, function (error, record) {
      if (error) {
        console.log('ERR - ', error, height);
      } else if (record) {
        holderRecords = record;
      }
      self.client.query(self.stakeInfoCollection, querySource, function (error, record) {
        if (error) {
          console.log('ERR - ', error, height);
        } else if (record) {
          sourceRecords = record;
        }
        const res = { holderRecords, sourceRecords }
        callback(error, res);
      })
    })
  }

  removeRecords(type, callback) {
    const queryObject = { 'type': type };
    this.client.remove(this.stakeInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('ERR - ', err, height);
        callback(err);
      }
      callback(err, res);
    })
  }
}