//------------------------------------------------------------------------------
//  DAO for stake
//  Require index: `db.subStake.createIndex({type:1})`
//  Require index: `db.subStake.createIndex({type:1, address:1})`
//------------------------------------------------------------------------------

module.exports = class subStakeDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.stakeInfoCollection = 'subStake';
    this.redis = redis;
  }

  insert(stakeInfo, callback) {
    const queryObj = { _id: stakeInfo._id };
    this.client.upsert(this.stakeInfoCollection, queryObj, stakeInfo, async function (error, record) {
      if (error) {
        console.log('error happend in stake upsert')
      } else {
        callback(error, record);
      }
    });
  }
  async updateStakes(candidateList, type, callback) {
    await this.removeRecordsAsync(type);
    for (let candidate of candidateList) {
      const stakeInfo = {
        '_id': id,
        'address': candidate.Address,
        'stake': candidate.Stake,
        'type': type
      }
      await this.insertAsync(stakeInfo);
    }
    callback();

  }

  getAllStakesByTypes(types, callback) {
    const queryObject = { 'type': { $in: types } };
    this.client.query(this.stakeInfoCollection, queryObject, function (error, recordList) {
      if (error) {
        console.log('ERR - ', error);
      } else if (!recordList) {
        callback(Error('NOT_FOUND - All Stakes'));
      } else {
        callback(error, recordList)
      }
    })
  }

  getAllStakes(callback) {
    this.client.findAll(this.stakeInfoCollection, function (error, recordList) {
      if (error) {
        console.log('Stake dao getAllStakes ERR - ', error);
        callback(error);
      } else if (!recordList) {
        callback(Error('NOT_FOUND - All Stakes'));
      } else {
        callback(error, recordList)
      }
    })
  }

  getStakeByAddress(address, types = ['vs'], callback) {
    const queryObject = { 'address': address, 'type': { $in: types } };
    this.client.query(this.stakeInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('Stake dao getStakeByAddress holders ERR - ', error, address);
        callback(error);
      } else if (record) {
        callback(err, record)
      }
    })
  }

  removeRecordsById(type, ids, hasRedis, callback) {
    const queryObject = { _id: { $in: ids }, 'type': type };
    this.client.remove(this.stakeInfoCollection, queryObject, async function (err, res) {
      if (err) {
        console.log('Stake dao removeRecordsById ERR - ', err, type, ids);
        callback(err);
      }
      callback(err, res);
    })
  }

  removeRecords(type, callback) {
    const queryObject = { 'type': type };
    this.client.remove(this.stakeInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('Stake dao removeRecords ERR - ', err, type);
        callback(err);
      }
      callback(err, res);
    })
  }
}