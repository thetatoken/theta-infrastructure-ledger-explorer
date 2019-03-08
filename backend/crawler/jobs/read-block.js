var rpc = require('../api/rpc.js');
var accountHelper = require('../helper/account');
var vcpHelper = require('../helper/vcp');
var txHelper = require('../helper/transactions');
var fs = require('fs');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var initialAccounts = null;
var accountFileName = 'theta-balance-height.json'
var progressDao = null;
var blockDao = null;
var network_id = 'test_chain_id';
var max_block_per_crawl = 5;
var target_crawl_height;
var txs_count = 0;
var crawled_block_height_progress = 0;
var latest_block_height = 0;
var upsertTransactionAsyncList = [];
var validTransactionList = [];
//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------
exports.Initialize = function (progressDaoInstance, blockDaoInstance, transactionDaoInstance, accountDaoInstance, accountTxDaoInstance, vcpDaoInstance) {
  blockDao = blockDaoInstance;
  progressDao = progressDaoInstance;
  transactionDao = transactionDaoInstance;
  accountDao = accountDaoInstance;
  accountTxDao = accountTxDaoInstance;
  vcpDao = vcpDaoInstance;
}

exports.Execute = async function () {
  await progressDao.getProgressAsync(network_id)
    .then(function (progressInfo) {
      txs_count = progressInfo.count;
      crawled_block_height_progress = progressInfo.height;
      console.log('DB transaction count progress: ' + txs_count.toString());
      console.log('crawled_block_height_progress: ', crawled_block_height_progress);
      return rpc.getPendingTxsAsync([])
    })
    .then(async function (data) {
      const result = JSON.parse(data);
      // console.log(result)
      const pendingTxList = result.result.tx_hashes;
      // const pendingTxList = ["12311", "23411", "34511", "45611", "56711", "67811", "78911", "89011", "90111", "12211", "12411", "12511"];
      let upsertTransactionAsyncList = [];
      for (let hash of pendingTxList) {
        const transaction = {
          hash: hash,
          status: 'pending'
        }
        const isExisted = await transactionDao.checkTransactionAsync(transaction.hash);
        if (!isExisted) {
          transaction.number = ++txs_count;
          validTransactionList.push(transaction);
          upsertTransactionAsyncList.push(transactionDao.upsertTransactionAsync(transaction));
        }
      }
      return Promise.all(upsertTransactionAsyncList)
    })
    .then(() => {
      return rpc.getStatusAsync([]) // read block height from chain
    })
    // .catch(err => {
    //   console.log(err)
    //   console.log('Met error after get status.')
    // })
    .then(function (data) {
      // console.log(data);
      var result = JSON.parse(data);
      latest_block_height = +result.result.latest_finalized_block_height;
      console.log('Latest block height: ' + latest_block_height);

      console.log('DB block height progress: ' + crawled_block_height_progress.toString());

      if (latest_block_height >= crawled_block_height_progress) {
        // get target crawl height
        target_crawl_height = crawled_block_height_progress + max_block_per_crawl;
        if (latest_block_height < target_crawl_height) {
          target_crawl_height = latest_block_height;
        }

        var getBlockAsyncList = [];
        var getVcpAsyncList = [];
        for (var i = crawled_block_height_progress + 1; i <= target_crawl_height; i++) {
          // console.log('Crawling new block: ' + i.toString());
          getBlockAsyncList.push(rpc.getBlockByHeightAsync([{ 'height': i.toString() }]));
          // getVcpAsyncList.push(rpc.getVcpByHeightAsync([{ 'height': i.toString() }]));
        }
        return Promise.all(getBlockAsyncList.concat(getVcpAsyncList))
      } else {
        console.log('Block crawling is up to date.');
      }
    })
    // .catch(err => {
    //   console.log(err)
    //   console.log('Met error after get blocks.')
    // })
    .then(async function (blockDataList) {
      if (blockDataList) {
        var upsertBlockAsyncList = [];
        var upsertVcpAsyncList = [];
        for (var i = 0; i < blockDataList.length; i++) {
          // Store the block data
          var result = JSON.parse(blockDataList[i]);
          // console.log(blockDataList[i]);
          if (result.result.BlockHashVcpPairs) {  // handle vcp response
            result.result.BlockHashVcpPairs.forEach(vcpPair => {
              vcpPair.Vcp.SortedCandidates.forEach(candidate => {
                upsertVcpAsyncList.push(vcpHelper.updateVcp(candidate, vcpDao));
              })
            })
          } else {  //handle block response
            var txs = result.result.transactions;
            const blockInfo = {
              epoch: result.result.epoch,
              status: result.result.status,
              height: result.result.height,
              timestamp: result.result.timestamp,
              hash: result.result.hash,
              parent_hash: result.result.parent,
              proposer: result.result.proposer,
              state_hash: result.result.state_hash,
              transactions_hash: result.result.transactions_hash,
              num_txs: result.result.transactions.length,
              txs: txHelper.getBriefTxs(result.result.transactions)
            }
            upsertBlockAsyncList.push(blockDao.upsertBlockAsync(blockInfo));
            // Store the transaction data
            if (txs !== undefined && txs.length > 0) {
              for (var j = 0; j < txs.length; j++) {
                const transaction = {
                  hash: txs[j].hash,
                  type: txs[j].type,
                  data: txs[j].raw,
                  block_height: blockInfo.height,
                  timestamp: blockInfo.timestamp,
                  status: 'finalized'
                }
                const isExisted = await transactionDao.checkTransactionAsync(transaction.hash);
                if (!isExisted) {
                  transaction.number = ++txs_count;
                  validTransactionList.push(transaction);
                  upsertTransactionAsyncList.push(transactionDao.upsertTransactionAsync(transaction));
                } else {
                  // TODO: get transaction's number
                  const tx = await transactionDao.getTransactionByPkAsync(transaction.hash);
                  transaction.number = tx.number;
                  validTransactionList.push(transaction);
                  upsertTransactionAsyncList.push(transactionDao.upsertTransactionAsync(transaction));
                }
              }
            }
          }
        }
        return Promise.all(upsertBlockAsyncList, upsertVcpAsyncList, upsertTransactionAsyncList)
      }
    })
    .then(() => {
      accountHelper.updateAccount(accountDao, accountTxDao, validTransactionList);
    })
    .then(async function () {
      validTransactionList = [];
      console.log('target_crawl_height: ', target_crawl_height, '. txs_count: ', txs_count)
      await progressDao.upsertProgressAsync(network_id, target_crawl_height, txs_count);
      console.log('Crawl progress updated to ' + target_crawl_height.toString());
    })
    .catch(async function (error) {
      if (error) {
        if (error.message === 'No progress record') {
          console.log('Initializng progress record..');
          progressDao.upsertProgressAsync(network_id, 0, 0);

          console.log('Loading initial accounts file: ' + accountFileName)
          try {
            initialAccounts = JSON.parse(fs.readFileSync(accountFileName));
          } catch (err) {
            console.log('Error: unable to load ' + accountFileName);
            console.log(err);
            process.exit(1);
          }
          // let counter = 1
          // for (let address of Object.keys(initialAccounts)) {
          //   console.log(counter++)
          //   await accountHelper.updateAccountByAddress(address, accountDao)
          // }
          Object.keys(initialAccounts).forEach(function (address, i) {
            setTimeout(function () {
              console.log(i)
              accountHelper.updateAccountByAddress(address, accountDao)
            }, i * 10);
          })
          // return Promise.all(getAccountAysncList)
        } else {
          console.log(error);
        }
      }
    })
}