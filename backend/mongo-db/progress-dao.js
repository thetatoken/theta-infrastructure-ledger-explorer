//------------------------------------------------------------------------------
//  DAO for chain status
//------------------------------------------------------------------------------

module.exports = class ProgressDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.progressInfoCollection = 'progress';
    this.redis = redis;
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
        console.log('Progress dao upsertProgress ERR - ', error);
        callback(error);
      } else {
        var progressInfo = {};
        progressInfo.height = newObject.lst_blk_height;
        progressInfo.count = newObject.txs_count;
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(progressInfo))
        }
        callback(error, record);
      }
    });
  }
  getProgress(network, callback) {
    let self = this;
    const redis_key = 'progress_network:' + network;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get progress met error:', err);
          query();
          return;
        }
        if (reply) {
          // console.log('Redis get progress returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log('Database get progress.');
        query();
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
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(progressInfo));
          }
          callback(error, progressInfo);
        }
      })
    }

  }
  upsertStakeProgress(type, total_amount, holder_num, callback) {
    let self = this;
    const redis_key = `progress_${type}_stake`;
    const queryObject = { '_id': `${type}_stake` };
    const newObject = {
      'total_amount': total_amount,
      'holder_num': holder_num,
      'type': type
    }
    this.client.upsert(this.progressInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('Progress dao upsertStakeProgress ERR - ', error);
        callback(error);
      } else {
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(newObject))
        }
        callback(error, record);
      }
    });
  }
  getStakeProgress(type, callback) {
    let self = this;
    const queryObject = { '_id': `${type}_stake` };
    const redis_key = `progress_${type}_stake`;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get stake progress met error:', err);
          query();
          return;
        }
        if (reply) {
          // console.log('Redis get stake progress returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log('Database get stake progress.');
        query();
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
          stakesInfo.type = record.type;
          if (self.redis !== null) {
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
        console.log('Progress dao upsertFee ERR - ', error);
        callback(error);
      } else {
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(newObject));
        }
        callback(error, record);
      }
    });
  }
  getFee(callback) {
    let self = this;
    const redis_key = 'progress_fee';
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get fee progress met error:', err);
          query();
          return;
        }
        if (reply) {
          callback(null, JSON.parse(reply));
          return;
        }
        console.log('Database get fee progress.');
        query();
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
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(feeInfo))
          }
          callback(error, feeInfo);
        }
      })
    }
  }
  upsertTokenProgress(height, callback) {
    const queryObject = { '_id': 'token_progress' };
    const newObject = {
      'block_height': height,
    }
    this.client.upsert(this.progressInfoCollection, queryObject, newObject, callback);
  }
  getTokenProgress(callback) {
    const queryObject = { '_id': 'token_progress' };
    this.client.findOne(this.progressInfoCollection, queryObject, callback);
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
        console.log('Progress dao upsertFeeProgress ERR - ', error);
        callback(error);
      } else {
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(newObject));
        }
        callback(error, record);
      }
    });
  }
  getFeeProgress(callback) {
    let self = this;
    const redis_key = 'progress_fee_height';
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get fee height progress met error:', err);
          query();
          return;
        }

        if (reply) {
          callback(null, JSON.parse(reply));
          return;
        }
        console.log('Database get fee height progress.');
        query();
      })
    } else {
      query();
    }
    function query() {
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
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(feeProgressInfo));
          }
          callback(error, feeProgressInfo);
        }
      })
    }
  }
}