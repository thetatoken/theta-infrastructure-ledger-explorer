//------------------------------------------------------------------------------
//  DAO for transaction
//  Require index: `db.transaction.createIndex({number:1})`
//  Require index: `db.transaction.createIndex({status:1})`
//  Require index: `db.transaction.createIndex({timestamp:-1})`
//  Require index: `db.transaction.createIndex({number:1,status:1})`
//  Require index: `db.transaction.createIndex({eth_tx_hash: 1})`

const { query } = require("./mongo-client");

//------------------------------------------------------------------------------
const redis_expire_time = 60;

module.exports = class TransactionDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.transactionInfoCollection = 'transaction';
    this.redis = redis;
  }

  upsertTransaction(transactionInfo, callback) {
    const redis_key = `tx_id:${transactionInfo.hash}`;
    let self = this;
    const newObject = {
      'hash': transactionInfo.hash,
      'eth_tx_hash': transactionInfo.eth_tx_hash,
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
        console.log('Transation dao upsertTransaction ERR - ', error);
        callback(error);
      } else {
        if (self.redis !== null) {
          self.redis.set(redis_key, JSON.stringify(newObject), 'ex', redis_expire_time)
        }
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

  getBriefTransactions(pageNumber, limitNumber, callback) {
    const queryObject = { 'status': 'finalized' };
    const sortObject = { 'number': -1 };
    const projectionObj = { number: 1, type: 1, hash: 1, _id: 0 }
    this.client.getRecordsWithProjection(this.transactionInfoCollection, queryObject, sortObject, projectionObj, pageNumber, limitNumber, callback);
  }

  getTransactionsByRange(min, max, callback) {
    const queryObject = { 'number': { $gte: min, $lte: max }, 'status': 'finalized' };
    this.client.query(this.transactionInfoCollection, queryObject, callback);
  }

  getTransactionByPk(pk, callback) {
    let self = this;
    const redis_key = `tx_id:${pk}`;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get transaction by pk met error:', err);
          query();
          return;
        }
        if (reply) {
          // console.log('Redis get transaction by pk returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log(`Redis does not contain the key ${redis_key}, query DB.`)
        query();
      })
    } else {
      query();
    }

    function query(type) {
      const queryObject = type == undefined ? { '_id': pk } : { 'eth_tx_hash': pk };
      self.client.findOne(self.transactionInfoCollection, queryObject, function (error, record) {
        if (error) {
          console.log('Transation dao getTransactionByPk ERR - ', error, pk);
          callback(error);
        } else if (!record) {
          if (type == undefined && pk !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
            query('eth_hash');
            return;
          }
          callback(Error('NOT_FOUND - ' + pk));
        } else {
          var transactionInfo = {};
          transactionInfo.hash = record.hash;
          transactionInfo.eth_tx_hash = record.eth_tx_hash;
          transactionInfo.type = record.type;
          transactionInfo.data = record.data;
          transactionInfo.number = record.number;
          transactionInfo.block_height = record.block_height;
          transactionInfo.timestamp = record.timestamp;
          transactionInfo.status = record.status;
          transactionInfo.receipt = record.receipt;
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(transactionInfo), 'ex', redis_expire_time)
          }
          callback(error, transactionInfo);
        }
      })
    }
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
        console.log('Transation dao getTotalNumberByHour ERR - ', error);
        callback(error);
      } else {
        // console.log('Calling get total number of txs, returns:', record)
        callback(error, record);
      }
    });
  }
  getTotalNumberByTimeRange(startTime, endTime, callback) {
    const queryObject = { 'timestamp': { $gte: startTime.toString(), $lte: endTime.toString() } };
    this.client.getTotal(this.transactionInfoCollection, queryObject, callback);
  }
  getTransactionsByPk(pks, callback) {
    let self = this;
    const redis_key = `tx_ids:${pks.join('_')}`;
    if (this.redis !== null) {
      this.redis.get(redis_key, (err, reply) => {
        if (err) {
          console.log('Redis get transactions by pks met error:', err);
          query();
          return;
        }

        if (reply) {
          // console.log('Redis get transactions by pks returns.');
          callback(null, JSON.parse(reply));
          return;
        }
        console.log(`Redis does not contain the key ${redis_key}, query DB.`)
        query();
      })
    } else {
      query();
    }
    function query() {
      const queryObject = { _id: { $in: pks } };
      self.client.getRecords(self.transactionInfoCollection, queryObject, {}, 0, 0, function (error, transactions) {
        if (error) {
          console.log('Transation dao getTransactionsByPk ERR - ', error, pks);
          callback(error);
        } else if (!transactions) {
          callback(Error('NOT_FOUND - ' + pks));
        } else {
          if (self.redis !== null) {
            self.redis.set(redis_key, JSON.stringify(transactions), 'ex', redis_expire_time)
          }
          callback(error, transactions);
        }
      })
    }
  }
  getTransactionsByType(type, pageNumber, limitNumber, callback) {
    const queryObject = { 'type': type };
    const sortObject = { 'number': -1 };
    this.client.getRecords(this.transactionInfoCollection, queryObject, sortObject, pageNumber, limitNumber, callback);
  }
  getTotalNumberByType(type, callback) {
    const queryObject = { 'type': type };
    this.client.getTotal(this.transactionInfoCollection, queryObject, callback);
  }
}