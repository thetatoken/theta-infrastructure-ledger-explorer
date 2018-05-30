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
      'fee': transactionInfo.fee,
      'gas': transactionInfo.gas,
      'pmt_sqnc': transactionInfo.payment_sequence,
      'rsv_sqnc': transactionInfo.reserve_sequence,
      'source': transactionInfo.source,
      'target': transactionInfo.target,
    }
    this.client.put(this.transactionInfoSet, this.RandomIdGenerator(), bins, {}, this.upsertPolicy, callback);
  }

  RandomIdGenerator() {
    var id = '';
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var length = 8;
    for (var i = 0; i < length; i++)
      id += charSet.charAt(Math.floor(Math.random() * charSet.length));
    return id;
  }

  // getBlock(height, callback) {
  //   this.client.get(this.blockInfoSet, height, null, function (error, record) {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       var blockInfo = {};
  //       blockInfo.height = record.bins.height;
  //       blockInfo.timestamp = record.bins.timestamp;
  //       blockInfo.hash = record.bins.hash;
  //       blockInfo.parent_hash = record.bins.parent_hash;
  //       blockInfo.num_txs = record.bins.num_txs;
  //       blockInfo.lst_cmt_hash = record.bins.lst_cmt_hash;
  //       blockInfo.data_hash = record.bins.data_hash;
  //       blockInfo.vldatr_hash = record.bins.vldatr_hash;
  //       blockInfo.txs = record.bins.txs;
  //       callback(error, blockInfo);
  //     }
  //   });
  // }

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