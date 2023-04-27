var axios = require("axios").default;

const BASE_URL = "https://theta-bridge-rpc.thetatoken.org/rpc";

const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

//------------------------------------------------------------------------------
//  Global variables
//------------------------------------------------------------------------------
var config = null;

//
//Helpers
//

function objectToQueryString(object) {
  if (!object) {
    return "";
  }

  let queryString = Object.keys(object).map(function (key) {
    let val = object[key];
    if (val) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(object[key]);
    }
  }).join('&');

  if (queryString.length > 0) {
    return "?" + queryString;
  }
  else {
    return "";
  }
}

//
// Builder
//
function buildHeaders(additionalHeaders) {
  //TODO inject auth headers here...
  return Object.assign(DEFAULT_HEADERS, additionalHeaders);
}
function buildURL(path, queryParams) {
  let url = null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    url = path + objectToQueryString(queryParams);
  }
  else {
    url = BASE_URL + path + objectToQueryString(queryParams);
  }

  return url;
}

function sendRequest(path, method, additionalHeaders, queryParams, body) {
  let url = buildURL(path, queryParams);
  let headers = buildHeaders(additionalHeaders);

  let opts = {
    method: method,
    headers: headers,
    url: url
  };

  if (body) {
    opts['data'] = JSON.stringify(body);
  }

  return axios.request(opts);
}
//
//Convenience requests
//
function POST(path, headers, queryParams, body) {
  return sendRequest(path, "POST", headers, queryParams, body);
}

class Api {
  static setConfig(cfg) {
    config = cfg;
  }

  static callSmartContract(body) {
    let path = config.thetaRPCEndpoint || '';
    console.log('callSmartContract path:', path);
    let rawTransaction = body.data;

    let data = {
      jsonrpc: '2.0',
      method: 'theta.CallSmartContract',
      params: [
        {
          "sctx_bytes": rawTransaction
        }
      ],
      id: 1
    };

    return POST(path, null, {}, data);
  }
}

module.exports = Api;