//------------------------------------------------------------------------------
//  DAO for chain status
//------------------------------------------------------------------------------

module.exports = class ProgressDAO {

  constructor(execDir, client, redis, redisEnabled) {
    this.client = client;
    this.progressInfoCollection = 'progress';
    this.redis = redis;
    this.redisEnabled = redisEnabled;
  }

  upsertProgress(network, block_height, count, callback) {
    let self = this;
    const redis_key = 'progress_network:' + network;
    const queryObject = { '_id': network };
    const newObject = {
      'network': network,
      'lst_blk_height': block_height,
      'txs_count': count
    }
    this.client.upsert(this.progressInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        var progressInfo = {};
        progressInfo.height = newObject.lst_blk_height;
        progressInfo.count = newObject.txs_count;
        if (self.redisEnabled) {
          self.redis.set(redis_key, JSON.stringify(progressInfo))
        }
        callback(error, record);
      }
    });
  }
  getProgress(network, callback) {
    let self = this;
    if (this.redisEnabled) {
      const redis_key = 'progress_network:' + network;
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get progress met error:', err);
        } else if (reply) {
          console.log('Redis get progress returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log('Database get progress.');
          query();
        }
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { '_id': network };
      self.client.findOne(self.progressInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log(error);
          callback(error);
        } else if (!record) {
          callback(Error('No progress record'));
        } else {
          var progressInfo = {};
          progressInfo.height = record.lst_blk_height;
          progressInfo.count = record.txs_count;
          if (self.redisEnabled) {
            self.redis.set(redis_key, JSON.stringify(progressInfo));
          }
          callback(error, progressInfo);
        }
      })
    }

  }
  upsertStakeProgress(total_amount, holder_num, callback) {
    let self = this;
    const redis_key = 'progress_stake';
    const queryObject = { '_id': 'stake' };
    const newObject = {
      'total_amount': total_amount,
      'holder_num': holder_num
    }
    this.client.upsert(this.progressInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        if (self.redisEnabled) {
          self.redis.set(redis_key, JSON.stringify(newObject))
        }
        callback(error, record);
      }
    });
  }
  getStakeProgress(callback) {
    let self = this;
    if (this.redisEnabled) {
      const redis_key = 'progress_stake';
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get stake progress met error:', err);
        } else if (reply) {
          console.log('Redis get stake progress returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log('Database get stake progress.');
          query();
        }
      })
    } else {
      query()
    }
    function query() {
      self.client.findOne(self.progressInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log(error);
          callback(error);
        } else if (!record) {
          callback(Error('No stake progress record'));
        } else {
          var stakesInfo = {};
          stakesInfo.total_amount = record.total_amount;
          stakesInfo.holder_num = record.holder_num;
          if (self.redisEnabled) {
            self.redis.set(redis_key, JSON.stringify(stakesInfo));
          }
          callback(error, stakesInfo);
        }
      })
    }
  }
  upsertFee(fee, callback) {
    let self = this;
    const redis_key = 'progress_fee';
    const queryObject = { '_id': 'fee' };
    const newObject = {
      'total_fee': fee,
    }
    this.client.upsert(this.progressInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        if (self.redisEnabled) {
          self.redis.set(redis_key, JSON.stringify(newObject));
        }
        callback(error, record);
      }
    });
  }
  getFee(callback) {
    let self = this;
    if (this.redisEnabled) {
      const redis_key = 'progress_fee';
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get fee progress met error:', err);
        } else if (reply) {
          console.log('Redis get fee progress returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log('Database get fee progress.');
          query();
        }
      })
    } else {
      query()
    }
    function query() {
      const queryObject = { '_id': 'fee' };
      self.client.findOne(self.progressInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log(error);
          callback(error);
        } else if (!record) {
          callback(Error('No fee record'));
        } else {
          var feeInfo = {};
          feeInfo.total_fee = record.total_fee;
          if (self.redisEnabled) {
            self.redis.set(redis_key, JSON.stringify(feeInfo))
          }
          callback(error, feeInfo);
        }
      })
    }
  }

  upsertFeeProgress(height, callback) {
    let self = this;
    const redis_key = 'progress_fee_height';
    const queryObject = { '_id': 'fee_progress' };
    const newObject = {
      'block_height': height,
    }
    this.client.upsert(this.progressInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        if (self.redisEnabled) {
          self.redis.set(redis_key, JSON.stringify(newObject));
        }
        callback(error, record);
      }
    });
  }
  getFeeProgress(callback) {
    let self = this;
    if (this.redisEnabled) {
      const redis_key = 'progress_fee_height';
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get fee height progress met error:', err);
        } else if (reply) {
          console.log('Redis get fee height progress returns.');
          callback(null, JSON.parse(reply));
        } else {
          console.log('Database get fee height progress.');
          query(self.redisEnabled);
        }
      })
    } else {
      query(this.redisEnabled);
    }
    function query(redisEnabled) {
      const queryObject = { '_id': 'fee_progress' };
      self.client.findOne(self.progressInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log(error);
          callback(error);
        } else if (!record) {
          callback(Error('No fee progress record'));
        } else {
          var feeProgressInfo = {};
          feeProgressInfo.block_height = record.block_height;
          if (redisEnabled) {
            self.redis.set(redis_key, JSON.stringify(feeProgressInfo));
          }
          callback(error, feeProgressInfo);
        }
      })
    }
  }
}