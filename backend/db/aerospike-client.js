var ns = null;
var client = null;
var path = require('path')
var Aerospike = null;

//------------------------------------------------------------------------------
//  Initialization
//------------------------------------------------------------------------------

exports.init = function (execDir, hostIp, hostPort, namespace) {
  Aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
  client = Aerospike.client({hosts: hostIp + ':' + hostPort.toString(), maxConnsPerNode: 300});
  ns = namespace;
}

//------------------------------------------------------------------------------
//  Implementations
//------------------------------------------------------------------------------

exports.connect = function (callback) {
  client.connect(callback);
}

exports.aerospikeDBParams = function() {
  return {
    defaultNamespace: 'test',
    defaultSet: 'test'
  }
}

exports.put = function(set, pk, bins, meta, policy, callback) {
  var key = new Aerospike.Key(ns, set, pk);
  client.put(key, bins, meta, policy, callback);
}

exports.get = function(set, pk, policy, callback) {
  var key = new Aerospike.Key(ns, set, pk);
  client.get(key, policy, callback);
}
exports.exists = function(set, pk, policy, callback){
  var key = new Aerospike.Key(ns, set, pk);
  client.exists(key, policy, callback);
}
exports.query = function(set, filter, callback) {
  var query = client.query(ns, set);
  query.where(filter);
  var stream = query.foreach();
  var recordList = []

  stream.on('data', function (record) {
    recordList.push(record);
  });
  stream.on('error', function (error) {
    console.log('Error when querying db:');
    console.log(error);
  });
  stream.on('end', function () { 
    callback(null, recordList);
  });
}