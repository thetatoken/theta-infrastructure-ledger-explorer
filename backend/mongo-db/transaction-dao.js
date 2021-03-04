//------------------------------------------------------------------------------
//  DAO for transaction
//  Require index: `db.transaction.createIndex({number:1})`
//  Require index: `db.transaction.createIndex({status:1})`
//  Require index: `db.transaction.createIndex({timestamp:-1})`
//  Require index: `db.transaction.createIndex({number:1,status:1})`
//  Require index: `db.transaction.createIndex({number:-1,status:1})`
//------------------------------------------------------------------------------
const redis_key = 'tx_id';
module.exports = class TransactionDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.transactionInfoCollection = 'transaction';
    this.redis = redis;
  }

  upsertTransaction(transactionInfo, callback) {
    let self = this;
    const redis_field = transactionInfo.hash;
    const newObject = {
      'hash': transactionInfo.hash,
      'type': transactionInfo.type,
      'data': transactionInfo.data,
      'number': transactionInfo.number,
      'block_height': transactionInfo.block_height,
      'timestamp': transactionInfo.timestamp,
      'receipt': transactionInfo.receipt,
      'status': transactionInfo.status
    }
    const queryObject = { '_id': newObject.hash };
    this.client.upsert(this.transactionInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        self.redis.hset(redis_key, redis_field, JSON.stringify(newObject))
        callback(error, record);
      }
    });
  }
  checkTransaction(hash, callback) {
    const queryObject = { '_id': hash };
    this.client.exist(this.transactionInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('error in checkTransaction: ', err);
        callback(err);
      }
      // console.log('result in check transaction: ', res);
      callback(err, res);
    });
  }
  getTransactions(pageNumber, limitNumber, diff, callback) {
    const queryObject = { 'status': 'finalized' };
    const sortObject = { 'number': diff === null ? -1 : 1 };
    pageNumber = pageNumber;
    limitNumber = limitNumber;
    this.client.getRecords(this.transactionInfoCollection, queryObject, sortObject, pageNumber, limitNumber, callback);
  }
  getTransactionByPk(pk, callback) {
    let self = this;
    const redis_field = pk;
    this.redis.hget(redis_key, redis_field, (err, reply) => {
      if (err) {
        console.log('Redis get transaction by pk met error:', err);
      } else if (reply) {
        console.log('Redis get transaction by pk returns.');
        callback(null, JSON.parse(reply));
      } else {
        const queryObject = { '_id': pk };
        this.client.findOne(this.transactionInfoCollection, queryObject, function (error, record) {
          if (error) {
            console.log('ERR - ', error, pk);
            callback(error);
          } else if (!record) {
            callback(Error('NOT_FOUND - ' + pk));
          } else {
            var transactionInfo = {};
            transactionInfo.hash = record.hash;
            transactionInfo.type = record.type;
            transactionInfo.data = record.data;
            transactionInfo.number = record.number;
            transactionInfo.block_height = record.block_height;
            transactionInfo.timestamp = record.timestamp;
            transactionInfo.status = record.status;
            transactionInfo.receipt = record.receipt;
            self.redis.hset(redis_key, redis_field, JSON.stringify(newObject))
            callback(error, transactionInfo);
          }
        })
      }
    })
  }
  getTotalNumberByHour(hour, callback) {
    let queryObject = null;
    if (hour !== null) {
      const now = Math.floor(new Date().getTime() / 1000);
      const startTime = now - hour * 60 * 60;
      queryObject = { timestamp: { $gte: startTime.toString(), $lte: now.toString() } }
    }
    this.client.getTotal(this.transactionInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        console.log('Calling get total number of txs, returns:', record)
        callback(error, record);
      }
    });
  }
  getTransactionsByPk(pks, callback) {
    let self = this;
    const redis_key = 'tx_ids'
    const redis_field = pks.join('_');
    this.redis.hget(redis_key, redis_field, (err, reply) => {
      if (err) {
        console.log('Redis get transactions by pks met error:', err);
      } else if (reply) {
        console.log('Redis get transactions by pks returns.');
        callback(null, JSON.parse(reply));
      } else {
        const queryObject = { _id: { $in: pks } };
        this.client.getRecords(this.transactionInfoCollection, queryObject, {}, 0, 0, function (error, transactions) {
          if (error) {
            console.log('ERR - ', error, pks);
          } else if (!transactions) {
            callback(Error('NOT_FOUND - ' + pks));
          } else {
            self.redis.hset(redis_key, redis_field, JSON.stringify(transactions))
            callback(error, transactions);
          }
        })
      }
    })
  }
}