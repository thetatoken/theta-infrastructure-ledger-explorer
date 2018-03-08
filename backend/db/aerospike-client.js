const Aerospike = require('aerospike')
var ns = null;
var client = null;

//------------------------------------------------------------------------------
//  Initialization
//------------------------------------------------------------------------------

exports.init = function (hostIp, hostPort, namespace) {
  client = Aerospike.client( {hosts: hostIp + ':' + hostPort.toString()});
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