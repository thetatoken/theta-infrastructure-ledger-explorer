var schedule = require('node-schedule');
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
var stakeDaoLib = require('../mongo-db/stake-dao.js');
var txHistoryDaoLib = require('../mongo-db/tx-history-dao.js');
var accountingDaoLib = require('../mongo-db/accounting-dao.js');
var checkpointDaoLib = require('../mongo-db/checkpoint-dao.js');

var readBlockCronJob = require('./jobs/read-block.js');
var readTxHistoryJob = require('./jobs/read-tx-history.js');
var accountingJob = require('./jobs/accounting.js');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg'
var blockDao = null;

//------------------------------------------------------------------------------
//  Start from here
//------------------------------------------------------------------------------
main();

//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------

function main() {
  Logger.initialize()
  // load config
  Logger.log('Loading config file: ' + configFileName)
  try {
    config = JSON.parse(fs.readFileSync(configFileName));
  } catch (err) {
    Logger.log('Error: unable to load ' + configFileName);
    Logger.log(err);
    process.exit(1);
  }
  Logger.log(config);
  const network_id = config.blockchain.network_id;
  rpc.setConfig(config);
  bluebird.promisifyAll(rpc);

  // connect to mongoDB
  mongoClient.init(__dirname, config.mongo.address, config.mongo.port, config.mongo.dbName);
  mongoClient.connect(config.mongo.uri, function (error) {
    if (error) {
      Logger.log('Mongo DB connection failed with err: ', error);
      process.exit();
    } else {
      Logger.log('Mongo DB connection succeeded');
      setupGetBlockCronJob(mongoClient, network_id);
    }
  });
}

// function setupGetBlockCronJob(aerospikeClient) {
//   // initialize DAOs
//   progressDao = new progressDaoLib(__dirname, aerospikeClient);
//   bluebird.promisifyAll(progressDao);

//   blockDao = new blockDaoLib(__dirname, aerospikeClient);
//   bluebird.promisifyAll(blockDao);

//   transactionDao = new transactionDaoLib(__dirname, aerospikeClient);
//   bluebird.promisifyAll(transactionDao);

//   accountDao = new accountDaoLib(__dirname, aerospikeClient);
//   bluebird.promisifyAll(accountDao);

//   readBlockCronJob.Initialize(progressDao, blockDao, transactionDao, accountDao);
//   schedule.scheduleJob('* * * * * *', readBlockCronJob.Execute);
// }

function setupGetBlockCronJob(mongoClient, network_id) {
  // initialize DAOs
  progressDao = new progressDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(progressDao);

  blockDao = new blockDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(blockDao);

  transactionDao = new transactionDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(transactionDao);

  accountDao = new accountDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountDao);

  accountTxDao = new accountTxDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountTxDao);

  stakeDao = new stakeDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(stakeDao);

  txHistoryDao = new txHistoryDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(txHistoryDao);

  accountingDao = new accountingDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountingDao);

  checkpointDao = new checkpointDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(checkpointDao);

  readBlockCronJob.Initialize(progressDao, blockDao, transactionDao, accountDao, accountTxDao, stakeDao, checkpointDao);
  setTimeout(async function run() {
    await readBlockCronJob.Execute(network_id);
    setTimeout(run, 1000);
  }, 1000);
  readTxHistoryJob.Initialize(transactionDao, txHistoryDao);
  schedule.scheduleJob('0 0 0 * * *', readTxHistoryJob.Execute);

  accountingJob.InitializeForTFuelPrice(accountingDao, config.accounting.coinbase_api_key, config.accounting.wallet_addresses);
  schedule.scheduleJob('0 0 0 * * *', accountingJob.RecordTFuelPrice); // GMT mid-night

  accountingJob.InitializeForTFuelEarning(transactionDao, accountTxDao, accountingDao, config.accounting.wallet_addresses);
  schedule.scheduleJob('0 0 7 * * *', accountingJob.RecordTFuelEarning); // PST mid-night - need to adjust according to daylight saving changes
}






