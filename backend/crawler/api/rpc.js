var http = require("http");
var https = require("https");

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;

//------------------------------------------------------------------------------
//  APIs
//------------------------------------------------------------------------------
exports.setConfig = function (cfg) {
  config = cfg;
}

exports.getBlock = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetBlock',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}

exports.getBlockByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetBlockByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}

exports.getStatus = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetStatus',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
exports.getAccount = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetAccount',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
exports.getVcpByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetVcpByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
exports.getGcpByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetGcpByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
exports.getEenpByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetEenpByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
exports.GetValidatorSetByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetValidatorSetByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
exports.getPendingTxs = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetPendingTransactions',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}

exports.getStakeRewardDistribution = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetStakeRewardDistributionByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', '/rpc', JSON.stringify(body), callback);
}
//------------------------------------------------------------------------------
//  Utils
//------------------------------------------------------------------------------

var RandomIdGenerator = function () {
  var id = '';
  var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var length = 8;
  for (var i = 0; i < length; i++)
    id += charSet.charAt(Math.floor(Math.random() * charSet.length));
  return id;
}

const MAX_CONCURRENCY = 100;

var ProcessHttpRequest = (function (maxConcurrency) {
  var requestQueue = [];
  var outstandingRequests = 0;

  var tryExecuteNextRequest = function () {
    if (outstandingRequests < maxConcurrency && requestQueue.length > 0) {
      var request = requestQueue.shift();
      outstandingRequests++;
      var originalCallback = request[request.length - 1];
      request[request.length - 1] = function () {
        outstandingRequests--;
        originalCallback.apply(null, arguments);
        tryExecuteNextRequest();
      }
      processHttpRequest.apply(null, request);
    }
  }

  return function (host, port, method, path, requestBody, callback) {
    requestQueue.push(arguments);
    tryExecuteNextRequest();
  };
})(MAX_CONCURRENCY);

var processHttpRequest = function (host, port, method, path, requestBody, callback) {
  var isHttps = host.includes('https');
  var options = {
    host: host.replace('https://', ''),
    port: port,
    method: method,
    path: path,
    headers: { 'Content-Type': 'application/json' }
  };
  if (config.log.level == 'debug') {
    console.log('[Debug] ____');
    console.log('[Debug] Http request: ' + JSON.stringify(options) + ' ' + requestBody);
  }

  const protocol = isHttps ? https : http;

  try {
    var req = protocol.request(options, function (res) {
      var body = '';
      res.setEncoding('utf8');
      res.on('data', function (dataBlock) {
        body += dataBlock;
      });
      res.on('end', function () {
        if (config.log.level == 'debug') {
          console.log('[Debug]' + body);
          console.log('[Debug] ____');
        }

        if (callback) { callback(null, body); }
      });
    });

    const timeout = config.requestTimeoutMs || 10000
    req.setTimeout(timeout, function () {
      req.abort();
      callback('Request Timeout: ' + path, null);
      callback = null;
    });

    req.on('error', function (error) {
      console.log('req error: ' + error)
      if (callback) { callback(error, null); }
    });

    req.write(requestBody);
    req.end();
  }
  catch (error) {
    callback(error.stack, null);
  }
}