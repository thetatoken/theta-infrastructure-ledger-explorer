//------------------------------------------------------------------------------
//  DAO for stake
//  Require index: `db.stake.createIndex({type:1})`
//  Require index: `db.stake.createIndex({type:1, holder:1})`
//  Require index: `db.stake.createIndex({type:1, source:1})`
//------------------------------------------------------------------------------

module.exports = class stakeDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.stakeInfoCollection = 'stake';
    this.redis = redis;
  }

  insert(stakeInfo, callback) {
    let self = this;
    const queryObj = { _id: stakeInfo._id };
    this.client.upsert(this.stakeInfoCollection, queryObj, stakeInfo, async function (error, record) {
      if (error) {
        console.log('error happend in stake upsert')
        // console.log('Stake dao ERR - ', error);
      } else {
        const redis_key = `stake_${stakeInfo.type}`;
        const field = `${stakeInfo.type}_${stakeInfo.holder}_${stakeInfo.source}`;
        if (self.redis !== null) {
          await self.redis.hset(redis_key, field, JSON.stringify(stakeInfo))
        }
        // console.log('In stake upsert else.')
        callback(error, record);
      }
    });
  }
  async updateStakes(candidateList, type, callback) {
    if (this.redis !== null) {
      await this.updateStakesWithRedis(candidateList, type);
    } else {
      await this.removeRecordsAsync(type);
      for (let candidate of candidateList) {
        const holder = candidate.Holder;
        const stakes = candidate.Stakes;
        for (let stake of stakes) {
          const id = `${type}_${holder}_${stake.source}`;
          const stakeInfo = {
            '_id': id,
            'type': type,
            'holder': holder,
            'source': stake.source,
            'amount': stake.amount,
            'withdrawn': stake.withdrawn,
            'return_height': stake.return_height
          }
          await this.insertAsync(stakeInfo);
        }
      }
      callback();
    }
  }
  async updateStakesWithRedis(candidateList, type) {
    console.log(`In update stakes. Type: ${type}`)
    let updateStakeList = [];
    let existKeys = new Set();
    try {
      const keys = await this.redis.hkeys(`stake_${type}`);
      console.log(`Redis get stakes by type:${type} returns.`);
      existKeys = new Set(keys);
    } catch (e) {
      console.log(`Redis get stakes by type:${type} met error:`, e);
    }
    console.log(`In update stakes type: ${type}, before for loop.`)
    for (let candidate of candidateList) {
      const holder = candidate.Holder;
      const stakes = candidate.Stakes;
      for (let stake of stakes) {
        const id = `${type}_${holder}_${stake.source}`;
        const stakeInfo = {
          '_id': id,
          'type': type,
          'holder': holder,
          'source': stake.source,
          'amount': stake.amount,
          'withdrawn': stake.withdrawn,
          'return_height': stake.return_height
        }
        if (existKeys.has(id)) {
          try {
            let stakeStr = await this.redis.hget(`stake_${type}`, id);
            existKeys.delete(id);
            if (stakeStr !== JSON.stringify(stakeInfo)) {
              updateStakeList.push(stakeInfo);
            }
          } catch (e) {
            console.log(`Redis get stakes by ${type} ${id} met error:`, e);
            updateStakeList.push(stakeInfo);
          }
        } else {
          updateStakeList.push(stakeInfo);
        }
      };
    };
    let deleteKeys = [...existKeys];
    console.log('updateStakeList length:', updateStakeList.length, type);
    console.log('deleteKeys length:', deleteKeys.length, type);

    for (let stake of updateStakeList) {
      await this.insertAsync(stake);
    }
    await this.removeRecordsByIdAsync(type, deleteKeys, true);
    console.log('before redis callback');
  }

  getAllStakesByTypes(types, callback) {
    const queryObject = { 'type': { $in: types } };
    this.client.query(this.stakeInfoCollection, queryObject, function (error, recordList) {
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

  getStakeByAddress(address, types = ['vcp', 'gcp'], callback) {
    const queryHolder = { 'holder': address, 'type': { $in: types } };
    const querySource = { 'source': address, 'type': { $in: types } };
    let holderRecords = [];
    let sourceRecords = [];
    const self = this;
    this.client.query(this.stakeInfoCollection, queryHolder, function (error, record) {
      if (error) {
        console.log('Stake dao getStakeByAddress holders ERR - ', error, address);
        callback(error);
      } else if (record) {
        holderRecords = record;
      }
      self.client.query(self.stakeInfoCollection, querySource, function (error, record) {
        if (error) {
          console.log('Stake dao getStakeByAddress sources ERR - ', error, address);
          callback(error);
        } else if (record) {
          sourceRecords = record;
        }
        const res = { holderRecords, sourceRecords }
        callback(error, res);
      })
    })
  }
  removeRecordsById(type, ids, hasRedis, callback) {
    let self = this;
    const queryObject = { _id: { $in: ids }, 'type': type };
    this.client.remove(this.stakeInfoCollection, queryObject, async function (err, res) {
      if (err) {
        console.log('Stake dao removeRecordsById ERR - ', err, type, ids);
        callback(err);
      }
      if (hasRedis) {
        const redis_key = `stake_${type}`;
        for (let id of ids) {
          // TODO: del multiple at one time
          self.redis.hdel(redis_key, id);
        }
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
  getAccountsByType(type, callback) {
    const field = 'holder';
    const queryObject = { 'type': type };
    this.client.distinct(this.stakeInfoCollection, field, queryObject, function (err, res) {
      if (err) {
        console.log('Stake dao getAccountsByType ERR - ', err, type);
        callback(err);
      }
      callback(err, res)
    })
  }
  getEenpStakeByAddress(address, callback) {
    const queryObj = { 'holder': address, 'type': 'eenp' };
    this.client.findOne(this.stakeInfoCollection, queryObj, function (err, res) {
      if (err) {
        console.log('Stake dao getEenpStakeByAddress ERR - ', err, address);
        callback(err);
      }
      callback(err, res);
    })
  }
  getValidEenpStaker(addresses, type, amount, Decimal128, callback) {
    const pipeline = [
      {
        $match: {
          source: { $in: addresses },
          type: type,
          withdrawn: false,
          $expr: {
            $gte: [
              { $toDecimal: "$amount" },
              Decimal128.fromString(amount)
            ]
          }
        }
      },
      {
        $group: {
          _id: "$source",
          valid_stakes: { $sum: 1 }
        }
      }
    ];
    this.client.aggregate(this.stakeInfoCollection, pipeline, callback);
  }
}