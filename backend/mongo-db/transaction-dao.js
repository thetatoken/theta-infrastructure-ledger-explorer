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
      'hash': transactionInfo.hash.toUpperCase(),
      'type': transactionInfo.type,
      'data': transactionInfo.data,
      'number': transactionInfo.number,
      'block_height': transactionInfo.block_height,
      'timestamp': transactionInfo.timestamp
    }
    const queryObject = {'hash': newObject.hash };
    this.client.upsert(this.transactionInfoCollection, queryObject, newObject, callback);
  }
  checkTransaction(queryObject, callback) {
    return this.client.exist(this.transactionInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('error in checkTransaction: ', err);
        throw err;
      }
      callback(err, res);
    });
  }
  //   getTransactions(min, max, callback) {
  //     // var filter = (min !== null && max !== null) ? this.aerospike.filter.range('uuid', min, max) : null;
  //     var filter = this.aerospike.filter.range('number', min, max);
  //     this.client.tryQuery(this.transactionInfoCollection, filter, function (error, recordList) {
  //       var transactionInfoList = []
  //       for (var i = 0; i < recordList.length; i++) {
  //         var transactionInfo = {};
  //         transactionInfo.hash = recordList[i].bins.hash;
  //         transactionInfo.type = recordList[i].bins.type;
  //         transactionInfo.data = recordList[i].bins.data;
  //         transactionInfo.number = recordList[i].bins.number;
  //         transactionInfo.block_height = recordList[i].bins.block_height;
  //         transactionInfo.timestamp = transactionInfo.timestamp;
  //         transactionInfoList.push(transactionInfo)
  //       }
  //       callback(error, transactionInfoList)
  //     }, 'query');
  //   }

  //   getTransactionByPk(pk, callback) {
  //     this.client.tryQuery(this.transactionInfoCollection, pk.toUpperCase(), function (error, record) {
  //       if (error) {
  //         switch (error.code) {
  //           // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
  //           // No record is found with the specified namespace/set/key combination.
  //           case 2:
  //             console.log('NOT_FOUND -', pk)
  //             callback(error);
  //             break
  //           default:
  //             console.log('ERR - ', error, uuid)
  //         }
  //       } else {
  //         var transactionInfo = {};
  //         transactionInfo.hash = record.bins.hash;
  //         transactionInfo.type = record.bins.type;
  //         transactionInfo.data = record.bins.data;
  //         transactionInfo.number = record.bins.number;
  //         transactionInfo.block_height = record.bins.block_height;
  //         transactionInfo.timestamp = record.bins.timestamp;
  //         callback(error, transactionInfo);
  //       }
  //     }, 'get');
  //   }
}