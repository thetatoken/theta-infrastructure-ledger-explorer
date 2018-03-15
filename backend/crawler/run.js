var schedule = require('node-schedule');
var bluebird = require("bluebird");
var fs = require('fs');
var rpc = require('./api/rpc.js');
var aerospikeClient = require('../db/aerospike-client.js');
var statusDaoLib = require('../db/status-dao.js');
var blockDaoLib = require('../db/block-dao.js');
var progressDaoLib = require('../db/progress-dao.js')
//var readStatusCronJob = require('./jobs/read-status.js');
var readBlockCronJob = require('./jobs/read-block.js');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg'
var statusDao = null;
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

  rpc.setConfig(config);
  bluebird.promisifyAll(rpc);

  // connect to db
  aerospikeClient.init(__dirname, config.aerospike.address, config.aerospike.port, config.aerospike.namespace);
  aerospikeClient.connect(function (error) {
    if (error) {
      console.log('DB connection failed');
      process.exit();
    } else {
      console.log('DB connection succeeded');
      setupGetBlockCronJob(aerospikeClient);
    }
  });
}

function setupGetBlockCronJob(aerospikeClient) {
  // initialize DAOs
  blockDao = new blockDaoLib(__dirname, aerospikeClient);
  bluebird.promisifyAll(blockDao);

  progressDao = new progressDaoLib(__dirname, aerospikeClient);
  bluebird.promisifyAll(progressDao);

  // statusDao = new statusDaoLib(aerospikeClient);
  // bluebird.promisifyAll(statusDao);

  // start cron jobs
  // readStatusCronJob.Initialize(statusDao);
  // schedule.scheduleJob('*/3 * * * * *', readStatusCronJob.Execute);
  
  readBlockCronJob.Initialize(progressDao, blockDao);
  schedule.scheduleJob('*/3 * * * * *', readBlockCronJob.Execute);
}








