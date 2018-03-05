var http = require("http")

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;

//------------------------------------------------------------------------------
//  APIs
//------------------------------------------------------------------------------
exports.SetConfig = function(cfg) {
  config = cfg;
}

exports.GetBlock = function(params, callback) {
  body = {
    jsonrpc: '2.0',
    method: 'theta.GetBlock',
    params: params,
    id: RandomIdGenerator()
  }

  ProcessHttpRequest(config.private_api_host, config.private_api_port, 'POST', '/rpc', body, callback);
}

//------------------------------------------------------------------------------
//  Utils
//------------------------------------------------------------------------------

var RandomIdGenerator = function() {
  var id = '';
  var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var length = 8;
  for (var i = 0; i < length; i++)
    id += charSet.charAt(Math.floor(Math.random() * charSet.length));
  return id;
}

var ProcessHttpRequest = function(host, port, method, path, requestBody, callback) {

  var options = {
    host: host,
    port: port,
    method: method,
    path: path,
    headers: {'Content-Type': 'application/json'}
  };
  if (config.log.log_level == 'debug'){
    console.log('[Debug] ____');
    console.log('[Debug] Http request: ' + JSON.stringify(options) + ' ' + requestBody);    
  }

  try {
    var req = http.request(options, function(res) { 
      var body = '';
      res.setEncoding('utf8');
      res.on('data', function(dataBlock) {
        body += dataBlock;
      });
      res.on('end', function() {
        if (config.log.log_level == 'debug'){
          console.log('[Debug]' + body);
          console.log('[Debug] ____');
        }

        if (callback) { callback(null, body); }
      });
    });

    req.setTimeout(10000, function() {
      req.abort();
      callback('Request Timeout: ' + path, null);
      callback = null;
    });

    req.on('error', function(error) {
      console.log('req error: ' + error)
      if (callback) { callback(error, null); }
    });

    req.write(requestBody);
    req.end();
  }
  catch(error) {
    callback(error.stack, null);
  }
}