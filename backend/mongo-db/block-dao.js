//------------------------------------------------------------------------------
//  DAO for block
//  Require index: `db.block.createIndex({timestamp:-1})`
//------------------------------------------------------------------------------
const redis_key = 'block_id';
module.exports = class BlockDAO {

  constructor(execDir, client, redis, redisEnabled) {
    this.client = client;
    this.redis = redis;
    this.redisEnabled = redisEnabled;
    this.blockInfoCollection = 'block';
  }

  upsertBlock(blockInfo, callback) {
    let self = this;
    let height = parseInt(blockInfo.height);
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
        console.log('ERR - ', error);
      } else {
        if (self.redisEnabled) {
          self.redis.hset(redis_key, height, JSON.stringify(newObject))
        }
        callback(error, record);
      }
    });
  }

  getBlock(height, callback) {
    let self = this;
    if (this.redisEnabled) {
      this.redis.hget(redis_key, height, (err, reply) => {
        if (err) {
          console.log('Redis get block height met error:', err);
        } else if (reply) {
          console.log('Redis get block height returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log(`Redis doesnot contain the key ${redis_key} ${height}, query DB.`)
          query();
        }
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { '_id': height };
      self.client.findOne(self.blockInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log('ERR - ', error, height);
          // callback(error);
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
          if (self.redisEnabled) {
            self.redis.hset(redis_key, height, JSON.stringify(blockInfo));
          }
          callback(error, blockInfo);
        }
      })
    }
  }

  getBlocksByRange(min, max, callback) {
    let self = this;
    const redis_key = 'block_range';
    const redis_field = max + '-' + min;
    if (this.redisEnabled) {
      this.redis.hget(redis_key, redis_field, (err, reply) => {
        if (err) {
          console.log('Redis get blocks by range met error:', err);
        } else if (reply) {
          console.log('Redis get blocks by range returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log(`Redis doesnot contain the key ${redis_key} ${redis_field}, query DB.`)
          query();
        }
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
        if (self.redisEnabled) {
          self.redis.hset(redis_key, redis_field, JSON.stringify(blockInfoList), 'EX', 60);
        }
        callback(error, blockInfoList)
      })
    }
  }

  getInfoListByTime(start, end, callback) {
    let self = this;
    const redis_key = 'block_time'
    const redis_field = start + '-' + end;
    if (this.redisEnabled) {
      this.redis.hget(redis_key, redis_field, (err, reply) => {
        if (err) {
          console.log('Redis get blocks by range met error:', err);
        } else if (reply) {
          console.log('Redis get blocks by range returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log(`Redis doesnot contain the key ${redis_key}, query DB.`)
          query();
        }
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { timestamp: { $gte: start, $lte: end } };
      self.client.getRecords(self.blockInfoCollection, queryObject, {}, 0, 0, function (error, recordList) {
        if (error) callback(error);
        else {
          if (self.redisEnabled) {
            self.redis.hset(redis_key, redis_field, JSON.stringify(recordList), 'EX', 60);
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
        console.log('ERR - ', error);
      } else {
        console.log('Calling get total number of blocks, returns:', record)
        callback(error, record);
      }
    });
  }
}