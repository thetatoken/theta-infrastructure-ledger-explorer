var ns = null;
var client = null;
var path = require('path')
var Aerospike = null;

//------------------------------------------------------------------------------
//  Initialization
//------------------------------------------------------------------------------

exports.init = function (execDir, hostIp, hostPort, namespace) {
  Aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
  client = Aerospike.client({ hosts: hostIp + ':' + hostPort.toString(), maxConnsPerNode: 300 });
  ns = namespace;
}

//------------------------------------------------------------------------------
//  Implementations
//------------------------------------------------------------------------------

exports.connect = function (callback) {
  client.connect(callback);
}

exports.aerospikeDBParams = function () {
  return {
    defaultNamespace: 'test',
    defaultSet: 'test'
  }
}
const MAX_CONCURRENCY = 150;

exports.tryQuery = (function (maxConcurrency) {

  var requestQueue = [];
  var outstandingRequests = 0;

  var tryExecuteNextRequest = function () {
    if (outstandingRequests < maxConcurrency && requestQueue.length > 0) {
      var request = requestQueue.shift();
      outstandingRequests++;
      var originalCallback = request[request.length - 2];
      request[request.length - 2] = function () {
        outstandingRequests--;
        if (originalCallback) originalCallback.apply(null, arguments);
        tryExecuteNextRequest();
      }
      //processHttpRequest.apply(null, request);

      const method = request[request.length - 1];
      // console.log(request)
      switch (method) {
        case 'put':
          put.apply(null, request);
          break;
        case 'get':
          get.apply(null, request);
          break;
        case 'exists':
          exists.apply(null, request);
          break;
        case 'query':
          query.apply(null, request);
          break;
        default:
          break;
      }
    }
  }

  return function () {
    // console.log(arguments)
    requestQueue.push(arguments);
    tryExecuteNextRequest();
  };
})(MAX_CONCURRENCY);

function put(set, pk, bins, meta, policy, callback) {
  var key = new Aerospike.Key(ns, set, pk);
  client.put(key, bins, meta, policy, callback);
}

function get(set, pk, policy, callback) {
  var key = new Aerospike.Key(ns, set, pk);
  client.get(key, policy, callback);
}
function exists(set, pk, policy, callback) {
  var key = new Aerospike.Key(ns, set, pk);
  client.exists(key, policy, callback);
}
function query(set, filter, callback) {
  // console.log(filter);
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