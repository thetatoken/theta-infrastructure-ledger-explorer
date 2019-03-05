var path = require('path');

//------------------------------------------------------------------------------
//  DAO for transaction
//------------------------------------------------------------------------------

module.exports = class TransactionDAO {

  constructor(execDir, client) {
    // this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.transactionInfoCollection = 'transaction';
    // this.upsertPolicy = new this.aerospike.WritePolicy({
    //   exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    // });
  }

  upsertTransaction(transactionInfo, callback) {
    const newObject = {
      'hash': transactionInfo.hash,
      'type': transactionInfo.type,
      'data': transactionInfo.data,
      'number': transactionInfo.number,
      'block_height': transactionInfo.block_height,
      'timestamp': transactionInfo.timestamp,
      'status': transactionInfo.status
    }
    const queryObject = { '_id': newObject.hash };
    this.client.upsert(this.transactionInfoCollection, queryObject, newObject, callback);
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
  getTransactions(min, max, callback) {
    const queryObject = { 'number': { $gte: min, $lte: max } };
    this.client.query(this.transactionInfoCollection, queryObject, function (error, recordList) {
      var transactionInfoList = []
      for (var i = 0; i < recordList.length; i++) {
        var transactionInfo = {};
        transactionInfo.hash = recordList[i].hash;
        transactionInfo.type = recordList[i].type;
        transactionInfo.data = recordList[i].data;
        transactionInfo.number = recordList[i].number;
        transactionInfo.block_height = recordList[i].block_height;
        transactionInfo.timestamp = recordList[i].timestamp;
        transactionInfo.status = recordList[i].status;
        transactionInfoList.push(transactionInfo)
      }
      callback(error, transactionInfoList)
    })
  }
  getTransactionByPk(pk, callback) {
    const queryObject = { '_id': pk };
    this.client.findOne(this.transactionInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error, pk);
        // callback(error);
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
        callback(error, transactionInfo);
      }
    })
  }
  getTotalNumber(callback) {
    this.client.getTotal(this.transactionInfoCollection, function (error, record) {
      if (error) {
        console.log('ERR - ', error);
      } else {
        console.log('Calling get total number of txs')
        callback(error, record);
      }
    });
  }
}