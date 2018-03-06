var blockDao = require('../db/block-dao.js');
var rpc = require('../api/rpc.js');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var blockDaoInstance = null;

//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------
exports.Initialize = function(aerospikeClient, callback) {
  blockDaoInstance = new blockDao(aerospikeClient);
  // blockInfo = {
  //   height:      'a',
  //   timeStamp:   '10230123',
  //   hash:        '0x1234',
  //   parentHash:  '0x4321'
  // }

  // blockDaoInstance.upsertBlock(blockInfo, null);

  // blockDaoInstance.getBlock('a', (record) => {
  //   console.log('callback:'); console.log(record);
  // });
}

exports.Execute = function(callback) {
  params = []
  params.push({
    height: 74875
  })

  rpc.GetBlockAsync(params)
  .then(function (data) {
    console.log(data);
    var result = JSON.parse(data);
  })
  .catch(function(error) {
    if (error != null) {
      console.log(error.stack);
    }

    if (callback != null) {
      callback(error, null);    
    }
  });
}