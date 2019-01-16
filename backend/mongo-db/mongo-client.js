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

exports.connect = function (callback) {
  if (_db) return callback();
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
exports.insertOne = function (collectionName, object, callback) {
  var collection = _db.collection(collectionName);
  collection.insertOne(object, function (err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    callback(err, res);
  });
}
exports.upsert = function (collectionName, queryObject, updateObject, callback) {
  var collection = _db.collection(collectionName);
  collection.update(queryObject, { $set: updateObject }, { upsert: true }, function (err, res) {
    if (err) throw err;
    // console.log(res);
    callback(err, res);
  });
}
exports.find = function (collectionName, callback) {
  var collection = _db.collection(collectionName);
  collection.findOne({}, function (err, res) {
    if (err) throw err;
    console.log(res);
    callback(err, res);
  });
}
exports.findOne = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.findOne(queryObject, function (err, res) {
    if (err) throw err;
    // console.log(res);
    callback(err, res);
  });
}
exports.exist = function (collectionName, queryObject, callback) {
  var collection = _db.collection(collectionName);
  collection.find(queryObject).limit(1).each(function (err, res) {
    if (err) throw err;
    callback(err, res);
  });
}