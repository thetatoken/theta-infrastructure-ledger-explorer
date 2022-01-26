var bluebird = require("bluebird");
var fs = require('fs');
var rpc = require('./api/rpc.js');
var Logger = require('./helper/logger');
var mongoClient = require('../mongo-db/mongo-client.js')
var transactionDaoLib = require('../mongo-db/transaction-dao.js');
var accountTxDaoLib = require('../mongo-db/account-tx-dao.js');
var smartContractDaoLib = require('../mongo-db/smart-contract-dao.js')
var tokenDaoLib = require('../mongo-db/token-dao.js')
var tokenSummaryDaoLib = require('../mongo-db/token-summary-dao.js')
var tokenHolderDaoLib = require('../mongo-db/token-holder-dao.js')

var Theta = require('./libs/Theta');

var redis = null;

var updatePreTokenSummaryCronJob = require('./jobs/update-token-summary.js');
//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg'

//------------------------------------------------------------------------------
//  Start from here
//------------------------------------------------------------------------------
main();

function main() {
  Logger.initialize('token-summary')
  // load config
  Logger.log('Loading config file: ' + configFileName)
  try {
    config = JSON.parse(fs.readFileSync(configFileName));
  } catch (err) {
    Logger.log('Error: unable to load ' + configFileName);
    Logger.log(err);
    process.exit(1);
  }
  rpc.setConfig(config);

  bluebird.promisifyAll(rpc);

  if (!config.defaultThetaChainID) {
    Logger.log('Error: unable to load config.defaultThetaChainID:', config.defaultThetaChainID);
    process.exit(1);
  }
  Theta.chainId = config.defaultThetaChainID;
  Logger.log('Theta.chainId:', Theta.chainId);

  // connect to mongoDB
  mongoClient.init(__dirname, config.mongo.address, config.mongo.port, config.mongo.dbName);
  mongoClient.connect(config.mongo.uri, function (error) {
    if (error) {
      Logger.log('Mongo DB connection failed with err: ', error);
      process.exit();
    } else {
      Logger.log('Mongo DB connection succeeded');
      setupGetBlockCronJob(mongoClient);
    }
  });
}


function setupGetBlockCronJob(mongoClient) {
  // initialize DAOs
  transactionDao = new transactionDaoLib(__dirname, mongoClient, redis);
  bluebird.promisifyAll(transactionDao);

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

  updatePreTokenSummaryCronJob.Initialize(transactionDao, accountTxDao,
    smartContractDao, tokenDao, tokenHolderDao, tokenSummaryDao);

  // updatePreTokenSummaryCronJob.Execute();
  // updatePreTokenSummaryCronJob.UpdateTNT721Name();
  // updatePreTokenSummaryCronJob.UpdateTNT20Decimals();
  updatePreTokenSummaryCronJob.UpdateTFUELFrom();
}