const BASE_URL = "https://api-wallet.thetatoken.org";

const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
};

//
//Helpers
//

export function isResponseSuccessful(response){
    let { status } = response;

    return (status === 200 || status === 201 || status === 202 || status === 204);
}

function objectToQueryString(object) {
    if(!object){
        return "";
    }

    let queryString = Object.keys(object).map(function(key) {
        let val = object[key];
        if(val){
            return encodeURIComponent(key) + '=' + encodeURIComponent(object[key]);
        }
    }).join('&');

    if(queryString.length > 0){
        return "?" + queryString;
    }
    else{
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
  };

  if (body) {
    opts['body'] = JSON.stringify(body);
  }

  return fetch(url, opts);
}
//
//Convenience requests
//
function POST(path, headers, queryParams, body) {
  return sendRequest(path, "POST", headers, queryParams, body);
}

export default class Api {
  static callSmartContract(body, queryParams) {
    let path = "/smart-contract/call";

    return POST(path, null, queryParams, body);
  }
}