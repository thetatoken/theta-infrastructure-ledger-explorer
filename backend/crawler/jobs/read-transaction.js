var rpc = require('../api/rpc.js');
var bluebird = require("bluebird");
var Aerospike = require('aerospike')

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var transactionProgressDao = null;
var transactionDao = null;
var current_block_hight = 0;
var network_id = 'test_chain_id_txs';
var max_block_per_crawl = 10;
var txs_count = 0;
//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------
exports.Initialize = function (transactionProgressDaoInstance, transactionDaoInstance, callback) {
  transactionDao = transactionDaoInstance;
  transactionProgressDao = transactionProgressDaoInstance;
}

exports.Execute = function (callback) {

  rpc.getStatusAsync([]) // read block height from chain
    .then(function (data) {
      console.log(data);
      var result = JSON.parse(data);
      latest_block_height = result.result.latest_block_height;
      console.log('Latest block height: ' + latest_block_height.toString());
      return transactionProgressDao.getProgressAsync(network_id);
    })
    .then(function (progressInfo) {
      var crawled_block_height_progress = progressInfo.height;
      txs_count = progressInfo.count;
      console.log('DB block height progress: ' + crawled_block_height_progress.toString());

      if (latest_block_height > crawled_block_height_progress) {
        // get target crawl height
        target_crawl_height = crawled_block_height_progress + max_block_per_crawl;
        if (latest_block_height < target_crawl_height) {
          target_crawl_height = latest_block_height;
        }

        var blockAsyncList = []
        for (var i = crawled_block_height_progress + 1; i <= target_crawl_height; i++) {
          console.log('Crawling new block: ' + i.toString());
          blockAsyncList.push(rpc.getBlockAsync([{ 'height': i }]))
        }
        return Promise.all(blockAsyncList)
      } else {
        console.log('Block crawling is up to date.');
      }
    })
    .then(function (blockDataList) {
      var upsertTransactionAsyncList = []
      // if (blockDataList !== undefined) {
      for (var i = 0; i < blockDataList.length; i++) {
        var result = JSON.parse(blockDataList[i]);
        var txs = result.result.Txs;
        // if(txs.length !== 1)console.log(txs.length);
        if (txs !== undefined && txs.length > 1) {
          console.log(txs)
          console.log(txs_count);
          for (var j = 0; j < txs.length - 1; j++) {
            console.log(txs[j])
            var transaction = {
              uuid: ++txs_count,
              fee: txs[j].fee,
              gas: txs[j].gas,
              payment_sequence: txs[j].payment_sequence,
              reserve_sequence: txs[j].reserve_sequence,
              source: txs[j].source,
              target: txs[j].target,
            }
            upsertTransactionAsyncList.push(transactionDao.upsertTransaction(transaction));
          }
        }
      }
      // }
      return Promise.all(upsertTransactionAsyncList)
    })
    .then(function () {
      console.log(target_crawl_height)
      transactionProgressDao.upsertProgressAsync(network_id, target_crawl_height, txs_count);
      console.log('Crawl transaction progress updated to ' + target_crawl_height.toString());
    })
    .catch(function (error) {
      if (error) {
        switch (error.code) {
          case Aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND:
            console.log('Initializng progress record..');
            transactionProgressDao.upsertProgressAsync(network_id, 0, 0)
            break;
          default:
            console.log(error);
        }
      }
    });
}