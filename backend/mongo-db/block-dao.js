var path = require('path');
//------------------------------------------------------------------------------
//  DAO for block
//------------------------------------------------------------------------------

module.exports = class BlockDAO {

  constructor(execDir, client) {
    // this.aerospike = require(path.join(execDir, 'node_modules', 'mongodb'));
    this.client = client;
    this.blockInfoCollection = 'block';
  }

  upsertBlock(blockInfo, callback) {
    const queryObject = { '_id': blockInfo.height };
    const newObject = {
      'height': blockInfo.height,
      'timestamp': blockInfo.timestamp,
      'hash': blockInfo.hash,
      'parent_hash': blockInfo.parent_hash,
      'num_txs': blockInfo.num_txs,
      'lst_cmt_hash': blockInfo.lst_cmt_hash,
      'data_hash': blockInfo.data_hash,
      'vldatr_hash': blockInfo.vldatr_hash,
      'txs': blockInfo.txs
    };
    this.client.upsert(this.blockInfoCollection, queryObject, newObject, callback);
  }

  getBlock(height, callback) {
    const queryObject = { '_id': height };
    this.client.findOne(this.blockInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error, height);
        // callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND -', height));
      } else {
        var blockInfo = {};
        blockInfo.height = record.height;
        blockInfo.timestamp = record.timestamp;
        blockInfo.hash = record.hash;
        blockInfo.parent_hash = record.parent_hash;
        blockInfo.num_txs = record.num_txs;
        blockInfo.lst_cmt_hash = record.lst_cmt_hash;
        blockInfo.data_hash = record.data_hash;
        blockInfo.vldatr_hash = record.vldatr_hash;
        blockInfo.txs = record.txs;
        callback(error, blockInfo);
      }
    })

  }

  getBlocksByRange(min, max, callback) {
    const queryObject = { '_id': { $gte: min, $lte: max } };
    this.client.query(this.blockInfoCollection, queryObject, function (error, recordList) {
      var blockInfoList = []
      for (var i = 0; i < recordList.length; i++) {
        var blockInfo = {};
        blockInfo.height = recordList[i].height;
        blockInfo.timestamp = recordList[i].timestamp;
        blockInfo.hash = recordList[i].hash;
        blockInfo.parent_hash = recordList[i].parent_hash;
        blockInfo.num_txs = recordList[i].num_txs;
        blockInfo.lst_cmt_hash = recordList[i].lst_cmt_hash;
        blockInfo.data_hash = recordList[i].data_hash;
        blockInfo.vldatr_hash = recordList[i].vldatr_hash;
        blockInfo.txs = recordList[i].txs;
        blockInfoList.push(blockInfo);
      }
      callback(error, blockInfoList)
    })
  }
}