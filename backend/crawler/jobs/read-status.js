var statusDao = require('../db/status-dao.js');
var rpc = require('../api/rpc.js');

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var statusDao = null;

//------------------------------------------------------------------------------
//  All the implementation goes below
//------------------------------------------------------------------------------
exports.Initialize = function(statusDaoInstance) {
  statusDao = statusDaoInstance;
}

exports.Execute = function(callback) {
  rpc.getStatusAsync([])
  .then(function (data) {
    console.log(data);
    var result = JSON.parse(data);
    statusInfo = {
      network:             result.result.node_info.network,
      latest_block_hash:   result.result.latest_block_hash,
      latest_app_hash:     result.result.latest_app_hash,
      latest_block_time:   result.result.latest_block_time,
      latest_block_height: result.result.latest_block_height
    }
    //return statusDao.upsertStatusAsync(statusInfo);
    return statusDao.getStatusAsync('test_chain_id');
  })
  .then(function (err, result) {
    console.log('error');
    console.log(err);
    console.log('result');
    console.log(result);
  })
  .catch(function(error) {
    if (error != null) {
      console.log(error);
    }

    if (callback != null) {
      callback(error, null);    
    }
  });
}