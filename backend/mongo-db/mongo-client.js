var MongoClient;
var path = require('path')
var dbName = null;
var client = null;
var _db = null;
var url = null;

//------------------------------------------------------------------------------
//  Initialization
//------------------------------------------------------------------------------
exports.init = function (execDir, hostIp, hostPort, dbName) {
  MongoClient = require(path.join(execDir, 'node_modules', 'mongodb')).MongoClient
  url = `mongodb://${hostIp}:${hostPort}/${dbName}`;
  // client = new MongoClient(url);
  dbName = dbName;
}

//------------------------------------------------------------------------------
//  Implementations
//------------------------------------------------------------------------------

exports.connect = function (uri, callback) {
  if (_db) return callback();
  url = uri ? uri : url;
  console.log(`url is: `, url);
  MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
    if (err) return callback(err)
    _db = db.db(dbName)
    callback();
  })
}
exports.getDB = function () {
  // client.close();
  return _db;
}
exports.close = function (callback) {
  if (_db) {
    _db.close(function (err, res) {
      _db = null;
      callback(err);
    })
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

exports.insert = function (collectionName, object, callback) {
  var collection = _db.collection(collectionName);
  collection.insertOne(object, function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}

exports.upsert = function (collectionName, queryObject, updateObject, callback) {
  var collection = _db.collection(collectionName);
  collection.updateOne(queryObject, { $set: updateObject }, { upsert: true, writeConcern: { w: "majority", wtimeout: 5000 } }, function (err, res) {
    if (err) callback(err);
    // console.log(res);
    callback(err, res);
  });
}
exports.findAll = function (collectionName, callback) {
  var collection = _db.collection(collectionName);
  collection.find({}).toArray(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}
exports.findOne = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.findOne(queryObject, function (err, res) {
    if (err) callback(err);
    // console.log(res);
    callback(err, res);
  });
}
exports.exist = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.find(queryObject).limit(1).each(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}
exports.query = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.find(queryObject).toArray(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}
exports.queryWithProjection = function (collectionName, queryObj, projectionObj, callback) {
  var collection = _db.collection(collectionName);
  collection.find(queryObj).project(projectionObj).toArray(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}
exports.getTotal = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.find(queryObject).count(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}
exports.getTopRecords = function (collectionName, queryObject, limitNumber, callback) {
  var collection = _db.collection(collectionName);
  collection.find().sort(queryObject).collation({ locale: "en_US", numericOrdering: true }).limit(limitNumber).toArray(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}

exports.getRecords = function (collectionName, queryObject, sortObject, pageNumebr, limitNumber, callback, diff) {
  var collection = _db.collection(collectionName);
  var newLimit = diff ? diff : limitNumber;
  collection.find(queryObject).sort(sortObject).skip(pageNumebr * limitNumber).limit(newLimit).toArray(function (err, res) {
    if (err) callback(err);
    callback(err, res);
  });
}

exports.removeAll = function (collectionName, callback) {
  if (collectionName === 'vcp') {
    var collection = _db.collection(collectionName);
    collection.deleteMany({}, function (err, res) {
      if (err) callback(err);
      callback(err, res);
    });
  } else {
    callback();
  }
}

exports.remove = function (collectionName, queryObject, callback) {
  if (collectionName === 'stake' || collectionName === 'txHistory') {
    var collection = _db.collection(collectionName);
    collection.deleteMany(queryObject, function (err, res) {
      if (err) callback(err);
      callback(err, res);
    });
  } else {
    callback();
  }
}

exports.createIndex = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.createIndex(queryObject, function (err, res) {
    if (err) callback(err);
    callback(err, res);
  })
}