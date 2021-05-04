//------------------------------------------------------------------------------
//  DAO for block
//  Require index: `db.block.createIndex({timestamp:-1})`
//------------------------------------------------------------------------------
const redis_expire_time = 60;
module.exports = class BlockDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.redis = redis;
    this.blockInfoCollection = 'block';
  }

  upsertBlock(blockInfo, callback) {
    let self = this;
    let height = parseInt(blockInfo.height);
    const redis_key = `block_id:${height}`;
    const queryObject = { '_id': height };
    const newObject = {
      'epoch': blockInfo.epoch,
      'status': blockInfo.status,
      'height': parseInt(blockInfo.height),
      'timestamp': blockInfo.timestamp,
      'hash': blockInfo.hash,
      'parent_hash': blockInfo.parent_hash,
      'proposer': blockInfo.proposer,
      'state_hash': blockInfo.state_hash,
      'transactions_hash': blockInfo.transactions_hash,
      'num_txs': blockInfo.num_txs,
      'txs': blockInfo.txs,
      'children': blockInfo.children,
      'hcc': blockInfo.hcc,
      'guardian_votes': blockInfo.guardian_votes
    };
    this.client.upsert(this.blockInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('Block dao upsertBlock ERR - ', error);
        callback(error)
      } else {
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(newObject), 'ex', redis_expire_time);
        }
        callback(error, record);
      }
    });
  }

  getBlock(height, callback) {
    let self = this;
    const redis_key = `block_id:${height}`;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get block height met error:', err);
          query();
          return;
        }
        if (reply) {
          // console.log('Redis get block height returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log(`Redis doesnot contain the key ${redis_key} ${height}, query DB.`)
        query();
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { '_id': height };
      self.client.findOne(self.blockInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log('Block dao getBlock ERR - ', error, height);
          callback(error);
        } else if (!record) {
          callback(Error('NOT_FOUND - ' + height));
        } else {
          // console.log(record);
          var blockInfo = {};
          blockInfo.epoch = record.epoch;
          blockInfo.status = record.status;
          blockInfo.height = record.height;
          blockInfo.timestamp = record.timestamp;
          blockInfo.hash = record.hash;
          blockInfo.parent_hash = record.parent_hash;
          blockInfo.proposer = record.proposer;
          blockInfo.state_hash = record.state_hash;
          blockInfo.transactions_hash = record.transactions_hash;
          blockInfo.num_txs = record.num_txs;
          blockInfo.txs = record.txs;
          blockInfo.guardian_votes = record.guardian_votes;
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(blockInfo), 'ex', redis_expire_time);
          }
          callback(error, blockInfo);
        }
      })
    }
  }

  getBlocksByRange(min, max, callback) {
    let self = this;
    const redis_key = 'block_range' + max + '-' + min;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get blocks by range met error:', err);
          query();
          return;
        }
        if (reply) {
          // console.log('Redis get blocks by range returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log(`Redis doesnot contain the key ${redis_key}, query DB.`)
        query();
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { '_id': { $gte: min, $lte: max } };
      self.client.query(self.blockInfoCollection, queryObject, function (error, recordList) {
        var blockInfoList = []
        for (var i = 0; i < recordList.length; i++) {
          var blockInfo = {};
          blockInfo.epoch = recordList[i].epoch;
          blockInfo.status = recordList[i].status;
          blockInfo.height = recordList[i].height;
          blockInfo.timestamp = recordList[i].timestamp;
          blockInfo.hash = recordList[i].hash;
          blockInfo.parent_hash = recordList[i].parent_hash;
          blockInfo.proposer = recordList[i].proposer;
          blockInfo.state_hash = recordList[i].state_hash;
          blockInfo.transactions_hash = recordList[i].transactions_hash;
          blockInfo.num_txs = recordList[i].num_txs;
          blockInfo.txs = recordList[i].txs;
          blockInfo.guardian_votes = recordList[i].guardian_votes,
            blockInfoList.push(blockInfo);
        }
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(blockInfoList), 'ex', 6);
        }
        callback(error, blockInfoList)
      })
    }
  }

  getInfoListByTime(start, end, callback) {
    let self = this;
    const redis_key = 'block_time' + start + '-' + end;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get blocks by range met error:', err)
          query();
          return;
        }
        if (reply) {
          // console.log('Redis get blocks by range returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log(`Redis doesnot contain the key ${redis_key}, query DB.`)
        query();
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { timestamp: { $gte: start, $lte: end } };
      self.client.getRecords(self.blockInfoCollection, queryObject, {}, 0, 0, function (error, recordList) {
        if (error) callback(error);
        else {
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(recordList), 'ex', redis_expire_time);
          }
          callback(error, recordList);
        }
      });
    }
  }
  getTotalNumberByHour(hour, callback) {
    let queryObject = null;
    if (hour !== null) {
      const now = Math.floor(new Date().getTime() / 1000);
      const startTime = now - hour * 60 * 60;
      queryObject = { timestamp: { $gte: startTime.toString(), $lte: now.toString() } }
    }
    console.log(queryObject);
    this.client.getTotal(this.blockInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('Block dao getTotalNumberByHour ERR - ', error);
        callback(error);
      } else {
        console.log('Calling get total number of blocks, returns:', record)
        callback(error, record);
      }
    });
  }
}