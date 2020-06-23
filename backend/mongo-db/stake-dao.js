//------------------------------------------------------------------------------
//  DAO for stake
//  Require index: `db.stake.createIndex({type:1})`
//------------------------------------------------------------------------------

module.exports = class stakeDAO {

  constructor(execDir, client) {
    this.client = client;
    this.stakeInfoCollection = 'stake';
  }

  insert(stakeInfo, callback) {
    this.client.insert(this.stakeInfoCollection, stakeInfo, callback);
  }

  getAllStakes(callback) {
    this.client.findAll(this.stakeInfoCollection, function (error, recordList) {
      if (error) {
        console.log('ERR - ', error);
        // callback(error);
      } else if (!recordList) {
        callback(Error('NOT_FOUND - All Stakes'));
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
        console.log('ERR - ', error, address);
      } else if (record) {
        holderRecords = record;
      }
      self.client.query(self.stakeInfoCollection, querySource, function (error, record) {
        if (error) {
          console.log('ERR - ', error, address);
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
        console.log('ERR - Remove Type', err, type);
        callback(err);
      }
      callback(err, res);
    })
  }
}