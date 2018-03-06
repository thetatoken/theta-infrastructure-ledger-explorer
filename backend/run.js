var schedule = require('node-schedule');
var bluebird = require("bluebird");
var fs = require('fs');
var rpc = require('./api/rpc.js');
var aerospikeClient = require('./db/aerospike-client.js');
var getBlockCronJob = require('./jobs/get-block.js')

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var configFileName = 'config.cfg'

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

  rpc.SetConfig(config);
  bluebird.promisifyAll(rpc);

  // connect to db
  aerospikeClient.init(config.aerospike.address, config.aerospike.port, config.aerospike.namespace);
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
  getBlockCronJob.Initialize(aerospikeClient);
  schedule.scheduleJob('*/5 * * * * *', getBlockCronJob.Execute);
}








