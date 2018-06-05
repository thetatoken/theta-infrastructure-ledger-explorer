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
      'uuid': transactionInfo.uuid,
      'fee': transactionInfo.fee,
      'gas': transactionInfo.gas,
      'pmt_sqnc': transactionInfo.payment_sequence,
      'rsv_sqnc': transactionInfo.reserve_sequence,
      'source': transactionInfo.source,
      'target': transactionInfo.target,
    }
    this.client.put(this.transactionInfoSet, bins.uuid, bins, {}, this.upsertPolicy, callback);
  }
  getTransactions(min, max, callback) {
    // var filter = (min !== null && max !== null) ? this.aerospike.filter.range('uuid', min, max) : null;
    var filter = this.aerospike.filter.range('uuid', min, max);
    this.client.query(this.transactionInfoSet, filter, function (error, recordList) {
      var transactionInfoList = []
      for (var i = 0; i < recordList.length; i++) {
        var transactionInfo = {};
        transactionInfo.uuid = recordList[i].bins.uuid;
        transactionInfo.fee = recordList[i].bins.fee;
        transactionInfo.gas = recordList[i].bins.gas;
        transactionInfo.pmt_sqnc = recordList[i].bins.pmt_sqnc;
        transactionInfo.rsv_sqnc = recordList[i].bins.rsv_sqnc;
        transactionInfo.source = recordList[i].bins.source;
        transactionInfo.target = recordList[i].bins.target;
        transactionInfoList.push(transactionInfo)
      }
      callback(error, transactionInfoList)
    });
  }

  getTransactionByUuid(uuid, callback) {
    this.client.get(this.transactionInfoSet, uuid, function (error, record) {
      if (error) {
        switch (error.code) {
          // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
          // No record is found with the specified namespace/set/key combination.
          case 2:
            console.log('NOT_FOUND -', uuid)
            callback(error);
            break
          default:
            console.log('ERR - ', error, uuid)
        }
      } else {
        var transactionInfo = {};
        transactionInfo.uuid = record.bins.uuid;
        transactionInfo.fee = record.bins.fee;
        transactionInfo.gas = record.bins.gas;
        transactionInfo.pmt_sqnc = record.bins.pmt_sqnc;
        transactionInfo.rsv_sqnc = record.bins.rsv_sqnc;
        transactionInfo.source = record.bins.source;
        transactionInfo.target = record.bins.target;
        callback(error, transactionInfo);
      }
    });
  }

  RandomIdGenerator() {
    var id = '';
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var length = 8;
    for (var i = 0; i < length; i++)
      id += charSet.charAt(Math.floor(Math.random() * charSet.length));
    return id;
  }


  // getBlocksByRange(min, max, callback) {
  //   var filter = this.aerospike.filter.range('height', min, max);
  //   this.client.query(this.blockInfoSet, filter, function (error, recordList) {
  //     var blockInfoList = []
  //     for (var i = 0; i < recordList.length; i++) {
  //       var blockInfo = {};
  //       blockInfo.height = recordList[i].bins.height;
  //       blockInfo.timestamp = recordList[i].bins.timestamp;
  //       blockInfo.hash = recordList[i].bins.hash;
  //       blockInfo.parent_hash = recordList[i].bins.parent_hash;
  //       blockInfo.num_txs = recordList[i].bins.num_txs;
  //       blockInfo.lst_cmt_hash = recordList[i].bins.lst_cmt_hash;
  //       blockInfo.data_hash = recordList[i].bins.data_hash;
  //       blockInfo.vldatr_hash = recordList[i].bins.vldatr_hash;
  //       blockInfo.txs = recordList[i].bins.txs;
  //       blockInfoList.push(blockInfo);
  //     }
  //     callback(error, blockInfoList)
  //   });
  // }
}