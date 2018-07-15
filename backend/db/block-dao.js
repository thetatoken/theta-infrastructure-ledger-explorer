var path = require('path');
//------------------------------------------------------------------------------
//  DAO for block
//------------------------------------------------------------------------------

module.exports = class BlockDAO {

  constructor(execDir, client) {
    this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.blockInfoSet = 'block';
    this.upsertPolicy = new this.aerospike.WritePolicy({
      exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertBlock(blockInfo, callback) {
    let bins = {
      'height': blockInfo.height,
      'timestamp': blockInfo.timestamp,
      'hash': blockInfo.hash,
      'parent_hash': blockInfo.parent_hash,
      'num_txs': blockInfo.num_txs,
      'lst_cmt_hash': blockInfo.lst_cmt_hash,
      'data_hash': blockInfo.data_hash,
      'vldatr_hash': blockInfo.vldatr_hash,
      'txs': blockInfo.txs
    }

    this.client.tryQuery(this.blockInfoSet, blockInfo.height, bins, {}, this.upsertPolicy, callback, 'put');
  }

  getBlock(height, callback) {
    this.client.tryQuery(this.blockInfoSet, height, null, function (error, record) {
      if (error) {
        switch (error.code) {
          // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
          // No record is found with the specified namespace/set/key combination.
          case 2:
            console.log('NOT_FOUND -', height)
            callback(error);
            break
          default:
            console.log('ERR - ', error, height)
        }
      } else {
        var blockInfo = {};
        blockInfo.height = record.bins.height;
        blockInfo.timestamp = record.bins.timestamp;
        blockInfo.hash = record.bins.hash;
        blockInfo.parent_hash = record.bins.parent_hash;
        blockInfo.num_txs = record.bins.num_txs;
        blockInfo.lst_cmt_hash = record.bins.lst_cmt_hash;
        blockInfo.data_hash = record.bins.data_hash;
        blockInfo.vldatr_hash = record.bins.vldatr_hash;
        blockInfo.txs = record.bins.txs;
        callback(error, blockInfo);
      }
    }, 'get');
  }

  getBlocksByRange(min, max, callback) {
    var filter = this.aerospike.filter.range('height', min, max);
    this.client.tryQuery(this.blockInfoSet, filter, function (error, recordList) {
      var blockInfoList = []
      for (var i = 0; i < recordList.length; i++) {
        var blockInfo = {};
        blockInfo.height = recordList[i].bins.height;
        blockInfo.timestamp = recordList[i].bins.timestamp;
        blockInfo.hash = recordList[i].bins.hash;
        blockInfo.parent_hash = recordList[i].bins.parent_hash;
        blockInfo.num_txs = recordList[i].bins.num_txs;
        blockInfo.lst_cmt_hash = recordList[i].bins.lst_cmt_hash;
        blockInfo.data_hash = recordList[i].bins.data_hash;
        blockInfo.vldatr_hash = recordList[i].bins.vldatr_hash;
        blockInfo.txs = recordList[i].bins.txs;
        blockInfoList.push(blockInfo);
      }
      callback(error, blockInfoList)
    }, 'query');
  }
}