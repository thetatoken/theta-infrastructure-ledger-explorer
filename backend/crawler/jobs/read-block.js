var rpc = require('../api/rpc.js');
var accountHelper = require('../helper/account');
var stakeHelper = require('../helper/stake');
var txHelper = require('../helper/transactions');
var fs = require('fs');
var Logger = require('../helper/logger');
const { createIndexes } = require('../helper/utils');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var configFileName = 'config.cfg'
var initialAccounts = {};
var accountFileName = 'theta-balance-height.json'
var progressDao = null;
var blockDao = null;
var transactionDao = null;
var accountDao = null;
var accountTxDao = null;
var stakeDao = null;
var checkpointDao = null;
var smartContractDao = null;
var dailyAccountDao = null;
var maxBlockPerCrawl;
var targetCrawlHeight;
var txsCount = 0;
var crawledBlockHeightProgress = 0;
var latestBlockHeight = 0;
var upsertTransactionAsyncList = [];
var validTransactionList = [];
var cacheEnabled = false;

// dec
var startTime;
//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------
exports.Initialize = function (progressDaoInstance, blockDaoInstance, transactionDaoInstance, accountDaoInstance,
  accountTxDaoInstance, stakeDaoInstance, checkpointDaoInstance, smartContractDaoInstance, dailyAccountDaoInstance, 
  cacheEnabledConfig, maxBlockPerCrawlConfig) {
  blockDao = blockDaoInstance;
  progressDao = progressDaoInstance;
  transactionDao = transactionDaoInstance;
  accountDao = accountDaoInstance;
  accountTxDao = accountTxDaoInstance;
  stakeDao = stakeDaoInstance;
  checkpointDao = checkpointDaoInstance;
  smartContractDao = smartContractDaoInstance;
  dailyAccountDao = dailyAccountDaoInstance;
  cacheEnabled = cacheEnabledConfig;
  maxBlockPerCrawl = Number(maxBlockPerCrawlConfig);
  maxBlockPerCrawl = Number.isNaN(maxBlockPerCrawl) ? 2 : maxBlockPerCrawl;
}

exports.Execute = async function (network_id) {
  await progressDao.getProgressAsync(network_id)
    .then(function (progressInfo) {
      Logger.log('Start a new crawler progress');
      Logger.log('progressInfo:', JSON.stringify(progressInfo));
      txsCount = progressInfo.count;
      crawledBlockHeightProgress = progressInfo.height;
      Logger.log('DB transaction count progress: ' + txsCount.toString());
      Logger.log('crawledBlockHeightProgress: ', crawledBlockHeightProgress);
      return rpc.getPendingTxsAsync([])
    })
    .then(async function (data) {
      const result = JSON.parse(data);
      const pendingTxList = result.result.tx_hashes;
      let upsertTransactionAsyncList = [];
      for (let hash of pendingTxList) {
        const transaction = {
          hash: hash,
          status: 'pending'
        }
        const isExisted = await transactionDao.checkTransactionAsync(transaction.hash);
        if (!isExisted) {
          transaction.number = ++txsCount;
          validTransactionList.push(transaction);
          upsertTransactionAsyncList.push(transactionDao.upsertTransactionAsync(transaction));
        }
      }
      Logger.log(`Number of upsert PENDING transactions: ${upsertTransactionAsyncList.length}`);
      return Promise.all(upsertTransactionAsyncList)
    })
    .then(() => {
      return rpc.getStatusAsync([]) // read block height from chain
    })
    .then(function (data) {
      var result = JSON.parse(data);
      latestBlockHeight = +result.result.latest_finalized_block_height;
      Logger.log('Latest block height: ' + latestBlockHeight);
      startTime = +new Date();
      Logger.log('DB block height progress: ' + crawledBlockHeightProgress.toString());

      if (latestBlockHeight >= crawledBlockHeightProgress) {
        // get target crawl height
        targetCrawlHeight = crawledBlockHeightProgress + maxBlockPerCrawl;
        if (latestBlockHeight < targetCrawlHeight) {
          targetCrawlHeight = latestBlockHeight;
        }

        var getBlockAsyncList = [];
        var getStakeAsyncList = [];
        for (var i = crawledBlockHeightProgress + 1; i <= targetCrawlHeight; i++) {
          getBlockAsyncList.push(rpc.getBlockByHeightAsync([{ 'height': i.toString() }]));
          getStakeAsyncList.push(rpc.getVcpByHeightAsync([{ 'height': i.toString() }]));
          getStakeAsyncList.push(rpc.getGcpByHeightAsync([{ 'height': i.toString() }]));
          getStakeAsyncList.push(rpc.getEenpByHeightAsync([{ 'height': i.toString() }]));
        }
        return Promise.all(getBlockAsyncList.concat(getStakeAsyncList))
      } else {
        Logger.error('Block crawling is up to date.');
      }
    })
    .then(async function (blockDataList) {
      let curTime = +new Date();
      Logger.log(`Query block info takes: ${curTime - startTime} ms`)
      if (blockDataList) {
        var upsertBlockAsyncList = [];
        var upsertVcpAsyncList = [];
        var updateVcpAsyncList = [];
        var updateGcpAsyncList = [];
        var upsertGcpAsyncList = [];
        var updateEenpAsyncList = [];
        var upsertEenpAsyncList = [];
        var upsertTransactionAsyncList = [];
        var checkpoint_height, checkpoint_hash;
        var upsertCheckpointAsyncList = [];
        var stakes = { vcp: [], gcp: [], eenp: [] };
        for (var i = 0; i < blockDataList.length; i++) {
          // Store the block data
          var result = JSON.parse(blockDataList[i]);

          if (result.result !== undefined) {
            if (result.result.BlockHashVcpPairs) {  // handle vcp response
              if (upsertVcpAsyncList.length > 0) continue;
              stakes.vcp = result.result.BlockHashVcpPairs;
              // await stakeDao.removeRecordsAsync('vcp');
              result.result.BlockHashVcpPairs.forEach(vcpPair => {
                vcpPair.Vcp.SortedCandidates.forEach(candidate => {
                  updateVcpAsyncList.push(candidate);
                  // upsertVcpAsyncList.push(stakeHelper.updateStake(candidate, 'vcp', stakeDao));
                })
              })
              upsertVcpAsyncList.push(stakeHelper.updateStakes(updateVcpAsyncList, 'vcp', stakeDao, cacheEnabled));
            } else if (result.result.BlockHashGcpPairs) { // handle GCP response
              if (upsertGcpAsyncList.length > 0) continue;
              stakes.gcp = result.result.BlockHashGcpPairs;
              // await stakeDao.removeRecordsAsync('gcp');
              result.result.BlockHashGcpPairs.forEach(gcpPair => {
                gcpPair.Gcp.SortedGuardians.forEach(candidate => {
                  updateGcpAsyncList.push(candidate);
                  // upsertGcpAsyncList.push(stakeHelper.updateStake(candidate, 'gcp', stakeDao));
                })
              })
              upsertGcpAsyncList.push(stakeHelper.updateStakes(updateGcpAsyncList, 'gcp', stakeDao, cacheEnabled));
            } else if (result.result.BlockHashEenpPairs) {  // hanndle EENP response
              if (upsertEenpAsyncList.length > 0) continue;
              stakes.eenp = result.result.BlockHashEenpPairs;
              result.result.BlockHashEenpPairs.forEach(eenpPair => {
                eenpPair.EENs.forEach(candidate => {
                  updateEenpAsyncList.push(candidate);
                })
              })
              Logger.log(`updateEenpAsyncList length: ${updateEenpAsyncList.length}`);
              upsertEenpAsyncList.push(stakeHelper.updateStakes(updateEenpAsyncList, 'eenp', stakeDao, cacheEnabled));
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
                txs: txHelper.getBriefTxs(result.result.transactions),
                children: result.result.children,
                hcc: result.result.hcc,
                guardian_votes: result.result.guardian_votes
              }
              if (result.result.height % 100 === 1) {
                checkpoint_height = blockInfo.height;
                checkpoint_hash = blockInfo.hash
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
                    receipt: txs[j].receipt,
                    status: 'finalized'
                  }
                  const isExisted = await transactionDao.checkTransactionAsync(transaction.hash);
                  if (!isExisted) {
                    transaction.number = ++txsCount;
                    validTransactionList.push(transaction);
                    upsertTransactionAsyncList.push(transactionDao.upsertTransactionAsync(transaction));
                  } else {
                    const tx = await transactionDao.getTransactionByPkAsync(transaction.hash);
                    transaction.number = tx.number;
                    validTransactionList.push(transaction);
                    upsertTransactionAsyncList.push(transactionDao.upsertTransactionAsync(transaction));
                  }
                }
              }
            }
          }
        }
        if (stakes.vcp.length !== 0) {
          // Update total stake info
          upsertGcpAsyncList.push(stakeHelper.updateTotalStake(stakes, progressDao))
        }
        if (checkpoint_hash)
          for (var i = 0; i < blockDataList.length; i++) {
            var result = JSON.parse(blockDataList[i]);
            if (result.result !== undefined && result.result.BlockHashGcpPairs)
              result.result.BlockHashGcpPairs.forEach(gcpPair => {
                if (gcpPair.BlockHash === checkpoint_hash) {
                  upsertCheckpointAsyncList.push(checkpointDao.insertAsync({
                    height: parseInt(checkpoint_height),
                    hash: checkpoint_hash,
                    guardians: gcpPair.Gcp.SortedGuardians
                  }))
                }
              })
          }
        Logger.log(`Number of upsert BLOCKS: ${upsertBlockAsyncList.length}`);
        Logger.log(`Number of upsert VCP: ${upsertVcpAsyncList.length}`);
        Logger.log(`Number of upsert GCP: ${upsertGcpAsyncList.length}`);
        Logger.log(`Number of upsert EENP: ${upsertEenpAsyncList.length}`);
        Logger.log(`Number of upsert check points: ${upsertCheckpointAsyncList.length}`);
        Logger.log(`Number of upsert TRANSACTIONS: ${upsertTransactionAsyncList.length}`);
        return Promise.all(upsertBlockAsyncList, upsertVcpAsyncList, upsertGcpAsyncList,
          upsertTransactionAsyncList, upsertCheckpointAsyncList, upsertEenpAsyncList,
          txHelper.updateFees(validTransactionList, progressDao))
      }
    })
    .then(() => {
      Logger.log('update account after handle all stakes')
      accountHelper.updateAccount(accountDao, accountTxDao, smartContractDao, dailyAccountDao, validTransactionList);
    })
    .then(async function () {
      validTransactionList = [];
      Logger.log('targetCrawlHeight: ', targetCrawlHeight, '. txsCount: ', txsCount)
      await progressDao.upsertProgressAsync(network_id, targetCrawlHeight, txsCount);
      Logger.log('Crawl progress updated to ' + targetCrawlHeight.toString());
      Logger.log('The end of a new crawler progress');
    })
    .catch(async function (error) {
      if (error) {
        if (error.message === 'No progress record') {
          Logger.log('Initializng progress record..');
          Logger.log('Loading config file: ' + configFileName)
          try {
            config = JSON.parse(fs.readFileSync(configFileName));
          } catch (err) {
            Logger.log('Error: unable to load ' + configFileName);
            Logger.log(err);
            process.exit(1);
          }
          Logger.log('Creating indexes...')
          await createIndexes();
          const start_height = Number(config.blockchain.start_height) - 1 || 0;
          Logger.log(`start_height: ${start_height}, type: ${typeof start_height}`);
          progressDao.upsertProgressAsync(network_id, start_height, 0);
          Logger.log('Loading initial accounts file: ' + accountFileName)
          try {
            initialAccounts = JSON.parse(fs.readFileSync(accountFileName));
          } catch (err) {
            Logger.error('Error: unable to load ' + accountFileName);
            Logger.error(err);
            process.exit(1);
          }
          Object.keys(initialAccounts).forEach(function (address, i) {
            setTimeout(function () {
              Logger.log(i)
              accountHelper.updateAccountByAddress(address, accountDao)
            }, i * 10);
          })
        } else {
          Logger.error(error);
        }
      }
    })
}