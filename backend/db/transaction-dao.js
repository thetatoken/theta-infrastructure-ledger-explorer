var path = require('path');

//------------------------------------------------------------------------------
//  DAO for transaction
//------------------------------------------------------------------------------

module.exports = class TransactionDAO {

  constructor(execDir, client) {
    this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.transactionInfoSet = 'transaction';
    this.upsertPolicy = new this.aerospike.WritePolicy({
      exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertTransaction(transactionInfo, callback) {
    let bins = {
      'hash': transactionInfo.hash,
      'type': transactionInfo.type,
      'data': transactionInfo.data,
      'number': transactionInfo.number
    }
    this.client.put(this.transactionInfoSet, bins.hash, bins, {}, this.upsertPolicy, callback);
  }
  checkTransaction(pk, callback){
    return this.client.exists(this.transactionInfoSet, pk, (err, res) => {
      callback(err, res)
    })
  }
  getTransactions(min, max, callback) {
    // var filter = (min !== null && max !== null) ? this.aerospike.filter.range('uuid', min, max) : null;
    var filter = this.aerospike.filter.range('number', min, max);
    this.client.query(this.transactionInfoSet, filter, function (error, recordList) {
      var transactionInfoList = []
      for (var i = 0; i < recordList.length; i++) {
        var transactionInfo = {};
        transactionInfo.hash = recordList[i].bins.hash;
        transactionInfo.type = recordList[i].bins.type;
        transactionInfo.data = recordList[i].bins.data;
        transactionInfo.number = recordList[i].bins.number;
        transactionInfoList.push(transactionInfo)
      }
      callback(error, transactionInfoList)
    });
  }

  getTransactionByPk(pk, callback) {
    this.client.get(this.transactionInfoSet, pk, function (error, record) {
      if (error) {
        switch (error.code) {
          // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
          // No record is found with the specified namespace/set/key combination.
          case 2:
            console.log('NOT_FOUND -', pk)
            callback(error);
            break
          default:
            console.log('ERR - ', error, uuid)
        }
      } else {
        var transactionInfo = {};
        transactionInfo.hash = record.bins.hash;
        transactionInfo.type = record.bins.type;
        transactionInfo.data = record.bins.data;
        transactionInfo.number = record.bins.number;
        callback(error, transactionInfo);
      }
    });
  }
}