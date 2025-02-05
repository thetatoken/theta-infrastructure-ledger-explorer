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

exports.getAccount = function (params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetAccount',
    params: params,
    id: RandomIdGenerator()
  }
  ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
}

// exports.getCode = function (params, callback) {
//   body = {
//     jsonrpc: '2.0',
//     method: 'theta.GetCode',
//     params: params,
//     id: RandomIdGenerator()
//   }
//   ProcessHttpRequest(config.node.address, config.node.port, 'POST', config.node.path, JSON.stringify(body), callback);
// }

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

var createAgent = (isHttps) => {
  return isHttps
    ? new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: config.requestTimeoutMs || 60000,
      freeSocketTimeout: config.freeSocketTimeoutMs || 10000,
    })
    : new http.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: config.requestTimeoutMs || 60000,
      freeSocketTimeout: config.freeSocketTimeoutMs || 10000,
    });
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
  var options = {
    host: host.replace('https://', ''),
    port: port,
    method: method,
    path: path,
    headers: { 'Content-Type': 'application/json' },
    agent: createAgent(isHttps),
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
        if (config.log.log_level == 'debug') {
          console.log('[Debug]' + body);
          console.log('[Debug] ____');
        }

        if (callback) { callback(null, body); }
      });
    });

    req.setTimeout(10000, function () {
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