var schedule = require('node-schedule')
var bluebird = require("bluebird");
var rpc = require('./api/rpc.js')
var aerospikeClient = require('./db/aerospike-client.js')
var blockDao = require('./db/block-dao.js')

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

  // connect to db
  aerospikeClient.init(config.aerospike.address, config.aerospike.port, config.aerospike.namespace);
  aerospikeClient.connect(function (error) {
    if (error) {
      console.log('DB connection failed');
      process.exit();
    } else {
      console.log('DB connection succeeded');
    }
  });

  

  blockDaoInstance = new blockDao(aerospikeClient);
  blockInfo = {
    height:      'a',
    timeStamp:   '10230123',
    hash:        '0x1234',
    parentHash:  '0x4321'
  }

  blockDaoInstance.upsertBlock(blockInfo, null);

  blockDaoInstance.getBlock('a', (record) => {
    console.log('callback:'); console.log(record);
  });

}








