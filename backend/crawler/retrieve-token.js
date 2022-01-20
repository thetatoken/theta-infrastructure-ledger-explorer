var bluebird = require("bluebird");
var fs = require('fs');
var rpc = require('./api/rpc.js');
var Logger = require('./helper/logger');
var mongoClient = require('../mongo-db/mongo-client.js')
var progressDaoLib = require('../mongo-db/progress-dao.js');
var blockDaoLib = require('../mongo-db/block-dao.js');
var transactionDaoLib = require('../mongo-db/transaction-dao.js');
var accountDaoLib = require('../mongo-db/account-dao.js');
var accountTxDaoLib = require('../mongo-db/account-tx-dao.js');
var smartContractDaoLib = require('../mongo-db/smart-contract-dao.js')
var tokenDaoLib = require('../mongo-db/token-dao.js')
var tokenSummaryDaoLib = require('../mongo-db/token-summary-dao.js')
var tokenHolderDaoLib = require('../mongo-db/token-holder-dao.js')

var Redis = require("ioredis");
var redis = null;
var redisConfig = null;
var cacheConfig = null; // node local cache configuration
var cacheEnabled = false;

var readPreTokenCronJob = require('./jobs/read-previous-token.js');
var express = require('express');
var app = express();
var cors = require('cors');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg'
var blockDao = null;
var rewardDistributionDao = null;

//------------------------------------------------------------------------------
//  Start from here
//------------------------------------------------------------------------------
main();

function main() {
  Logger.initialize('token')
  // load config
  Logger.log('Loading config file: ' + configFileName)
  try {
    config = JSON.parse(fs.readFileSync(configFileName));
  } catch (err) {
    Logger.log('Error: unable to load ' + configFileName);
    Logger.log(err);
    process.exit(1);
  }
  const networkId = config.blockchain.networkId;
  const retrieveStartHeight = config.retrieveTokenStartHeight;
  rpc.setConfig(config);

  bluebird.promisifyAll(rpc);

  redisConfig = config.redis;
  Logger.log("redisConfig:", redisConfig)
  cacheEnabled = config.nodeCache && config.nodeCache.enabled;
  Logger.log('cacheEnabled:', cacheEnabled);
  if (redisConfig && redisConfig.enabled) {
    redis = redisConfig.isCluster ? new Redis.Cluster([
      {
        host: redisConfig.host,
        port: redisConfig.port,
      },
    ], {
      redisOptions: {
        password: redisConfig.password,
      }
    }) : new Redis(redisConfig);
    bluebird.promisifyAll(redis);
    redis.on("connect", () => {
      Logger.log('connected to Redis');
    });
  }

  // connect to mongoDB
  mongoClient.init(__dirname, config.mongo.address, config.mongo.port, config.mongo.dbName);
  mongoClient.connect(config.mongo.uri, function (error) {
    if (error) {
      Logger.log('Mongo DB connection failed with err: ', error);
      process.exit();
    } else {
      Logger.log('Mongo DB connection succeeded');
      setupGetBlockCronJob(mongoClient, networkId, retrieveStartHeight);
    }
  });
}


function setupGetBlockCronJob(mongoClient, networkId, retrieveStartHeight) {
  // initialize DAOs
  progressDao = new progressDaoLib(__dirname, mongoClient, redis);
  bluebird.promisifyAll(progressDao);

  blockDao = new blockDaoLib(__dirname, mongoClient, redis);
  bluebird.promisifyAll(blockDao);

  transactionDao = new transactionDaoLib(__dirname, mongoClient, redis);
  bluebird.promisifyAll(transactionDao);

  accountDao = new accountDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountDao);

  accountTxDao = new accountTxDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountTxDao);

  smartContractDao = new smartContractDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(smartContractDao);

  tokenDao = new tokenDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(tokenDao);

  tokenSummaryDao = new tokenSummaryDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(tokenSummaryDao);

  tokenHolderDao = new tokenHolderDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(tokenHolderDao);

  readPreTokenCronJob.Initialize(progressDao, blockDao, transactionDao, accountDao, accountTxDao,
    smartContractDao, tokenDao, tokenHolderDao, tokenSummaryDao);

  setTimeout(async function run() {
    Logger.log('Start of Execute.');
    const startTime = +new Date();
    let flag = { result: true };
    await readPreTokenCronJob.Execute(networkId, retrieveStartHeight, flag);
    if (flag.result) {
      readPreTokenTimer = setTimeout(run, 1000);
    } else {
      Logger.log('Mission Completed!');
    }
    Logger.log('End of Execute, takes:', (+new Date() - startTime) / 1000, ' seconds');
  }, 1000);

}