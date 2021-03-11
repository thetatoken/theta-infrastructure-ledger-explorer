//------------------------------------------------------------------------------
//  DAO for stake
//  Require index: `db.stake.createIndex({type:1})`
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
        // console.log('ERR - ', error);
      } else {
        const redis_key = `stake_${stakeInfo.type}`;
        const field = `${stakeInfo.type}_${stakeInfo.holder}_${stakeInfo.source}`;
        if (self.redis !== null) {
          await self.redis.hset(redis_key, field, JSON.stringify(stakeInfo))
        }
        console.log('In stake upsert else.')
        callback(error, record);
      }
    });
  }
  async updateStakes(candidateList, type, callback) {
    if (this.redis !== null) {
      await this.updateStakesWithRedis(candidateList, type, callback);
    } else {
      console.log('type:', type)
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
  async updateStakesWithRedis(candidateList, type, callback) {
    console.log('In update stakes.')
    let updateStakeList = [];
    let existKeys = new Set();
    try {
      const keys = await this.redis.hkeys(`stake_${type}`);
      console.log(`Redis get stakes by type:${type} returns.`);
      existKeys = new Set(keys);
    } catch (e) {
      console.log(`Redis get stakes by type:${type} met error:`, e);
    }
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
          // console.log(`In has id: ${id}`)
          try {
            let stakeStr = await this.redis.hget(`stake_${type}`, id);
            // console.log('compare:', JSON.stringify(stakeInfo) === stakeStr);
            existKeys.delete(id);
            // console.log('existKeys:', existKeys)
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
    console.log('updateStakeList:', updateStakeList);
    console.log('deleteKeys:', deleteKeys);

    for (let stake of updateStakeList) {
      await this.insert(stake, () => { });
    }
    await this.removeRecordsById(type, deleteKeys, () => { });
    callback();
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
  removeRecordsById(type, ids, callback) {
    let self = this;
    const queryObject = { id: { $in: ids }, 'type': type };
    this.client.remove(this.stakeInfoCollection, queryObject, async function (err, res) {
      if (err) {
        console.log('ERR - Remove ids', err, type, ids);
        callback(err);
      }
      const redis_key = `stake_${type}`;
      for (let id of ids) {
        // TODO: del multiple at one time
        self.redis.hdel(redis_key, id);
      }
      callback(err, res);
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