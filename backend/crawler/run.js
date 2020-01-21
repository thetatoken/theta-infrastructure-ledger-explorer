var schedule = require('node-schedule');
var bluebird = require("bluebird");
var fs = require('fs');
var rpc = require('./api/rpc.js');
// var aerospikeClient = require('../db/aerospike-client.js');
var mongoClient = require('../mongo-db/mongo-client.js')
var progressDaoLib = require('../mongo-db/progress-dao.js');
var blockDaoLib = require('../mongo-db/block-dao.js');
var transactionDaoLib = require('../mongo-db/transaction-dao.js');
var accountDaoLib = require('../mongo-db/account-dao.js');
var accountTxDaoLib = require('../mongo-db/account-tx-dao.js');
var accountTxSendDaoLib = require('../mongo-db/account-tx-send-dao.js');
var stakeDaoLib = require('../mongo-db/stake-dao.js');
var txHistoryDaoLib = require('../mongo-db/tx-history-dao.js');
var accountingDaoLib = require('../mongo-db/accounting-dao.js');

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

  // load config
  console.log('Loading config file: ' + configFileName)
  try {
    config = JSON.parse(fs.readFileSync(configFileName));
  } catch (err) {
    console.log('Error: unable to load ' + configFileName);
    console.log(err);
    process.exit(1);
  }
  console.log(config);
  const network_id = config.blockchain.network_id;
  rpc.setConfig(config);
  bluebird.promisifyAll(rpc);

  // connect to db
  // aerospikeClient.init(__dirname, config.aerospike.address, config.aerospike.port, config.aerospike.namespace);
  // aerospikeClient.connect(function (error) {
  //   if (error) {
  //     console.log('DB connection failed');
  //     process.exit();
  //   } else {
  //     console.log('DB connection succeeded');
  //     setupGetBlockCronJob(aerospikeClient);
  //   }
  // });

  // connect to mongoDB
  mongoClient.init(__dirname, config.mongo.address, config.mongo.port, config.mongo.dbName);
  mongoClient.connect(config.mongo.uri, function (error) {
    if (error) {
      console.log('Mongo DB connection failed with err: ', error);
      process.exit();
    } else {
      console.log('Mongo DB connection succeeded');
      // const mongoDB = mongoClient.getDB();
      // const queryObject = { 'network': 'testnet_chain_id' };
      // const newObject = {
      //   'network': 'testnet_chain_id',
      //   'lst_blk_height': 1213,
      //   'txs_count': 451
      // }
      // mongoClient.upsert('progress', queryObject, newObject, function () { });
      // mongoClient.find('progress', function () { });
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

  accountTxSendDao = new accountTxSendDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountTxSendDao);

  stakeDao = new stakeDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(stakeDao);

  txHistoryDao = new txHistoryDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(txHistoryDao);

  accountingDao = new accountingDaoLib(__dirname, mongoClient);
  bluebird.promisifyAll(accountingDao);

  readBlockCronJob.Initialize(progressDao, blockDao, transactionDao, accountDao, accountTxDao, accountTxSendDao, stakeDao);
  setTimeout(async function run() {
    await readBlockCronJob.Execute(network_id);
    setTimeout(run, 1000);
  }, 1000);
  readTxHistoryJob.Initialize(transactionDao, txHistoryDao);
  schedule.scheduleJob('0 0 0 * * *', readTxHistoryJob.Execute);

  accountingJob.Initialize(transactionDao, accountTxDao, accountingDao, config.coinbase.api_key);
  schedule.scheduleJob('0 0 0 * * *', accountingJob.Execute);
}






