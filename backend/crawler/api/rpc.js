var http = require("http");
var https = require("https");

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;
var agentHttp = null;
var agentHttps = null;

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
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}

exports.getBlockByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetBlockByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}

exports.getStatus = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetStatus',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
exports.getAccount = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetAccount',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
exports.getVcpByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetVcpByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
exports.getGcpByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetGcpByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
exports.getEenpByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetEenpByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
exports.GetValidatorSetByHeight = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetValidatorSetByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
exports.getPendingTxs = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetPendingTransactions',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}

exports.getStakeRewardDistribution = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetStakeRewardDistributionByHeight',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}
//------------------------------------------------------------------------------
//  Utils
//------------------------------------------------------------------------------

var RandomIdGenerator = function () {
  var id = '';
  var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var length = 8;
  for (var i = 0; i < length; i++) {
    id += charSet.charAt(Math.floor(Math.random() * charSet.length));
  }
  return id;
};

var MAX_CONCURRENCY = 50;

var createAgentHttp = () => {
  if (!config) throw new Error("Config not set. Call setConfig() before using RPC.");
  if (!agentHttp) {
    agentHttp = new http.Agent({
      keepAlive: true,
      maxSockets: 200,
      maxFreeSockets: 50,
      timeout: (config.requestTimeoutMs || 60000) + 5000,
      freeSocketTimeout: config.freeSocketTimeoutMs || 10000,
    });
  }
  return agentHttp;
};

var createAgentHttps = () => {
  if (!config) throw new Error("Config not set. Call setConfig() before using RPC.");
  if (!agentHttps) {
    agentHttps = new https.Agent({
      keepAlive: true,
      maxSockets: 200,
      maxFreeSockets: 50,
      timeout: (config.requestTimeoutMs || 60000) + 5000,
      freeSocketTimeout: config.freeSocketTimeoutMs || 10000,
    });
  }
  return agentHttps;
};

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

var processHttpRequest = function (host, port, method, path = '/rpc', requestBody, callback) {
  var isHttps = host.includes('https');
  var timeout = config.requestTimeoutMs || 60000

  var options = {
    host: host.replace('https://', ''),
    port: port,
    method: method,
    path: path,
    headers: { 'Content-Type': 'application/json' },
    timeout: timeout,
    agent: isHttps ? createAgentHttps() : createAgentHttp(),
  };
  if (config && config.log && config.log.level === 'debug') {
    console.log('[Debug] ____');
    console.log('[Debug] HTTP Request:', JSON.stringify(options), requestBody);
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
        if (config && config.log && config.log.level === 'debug') {
          console.log('[Debug] Response:', body);
          console.log('[Debug] ____');
        }

        if (callback) { callback(null, body); }
      });
    });

    req.setTimeout(timeout, function () {
      req.abort();
      if (callback) {
        callback(new Error(`Request Timeout: ${path}`), null);
      }
    });

    req.on('error', function (error) {
      console.log('[Error] Request Error:', error);
      if (callback) { callback(error, null); }
    });

    req.write(requestBody);
    req.end();
  } catch (error) {
    console.error('[Error] Exception:', error);
    if (callback) {
      callback(error.stack, null);
    }
  }
};