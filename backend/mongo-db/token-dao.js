//------------------------------------------------------------------------------
//  DAO for token
//  Require index: `db.token.createIndex({contract_address:1, timestamp:-1})`
//  Require index: `db.token.createIndex({contract_address:1, tokenId:1, timestamp:-1})`
//  Require index: `db.token.createIndex({contract_address:1, type:1})`
//  Require index: `db.token.createIndex({from:1, type:1, timestamp:-1})`
//  Require index: `db.token.createIndex({to:1, type:1, timestamp:-1})`
//  Require index: `db.token.createIndex({from:1, type:1})`
//  Require index: `db.token.createIndex({to:1, type:1})`
//------------------------------------------------------------------------------

module.exports = class TokenDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'token';
  }

  insert(data, callback) {
    this.client.insert(this.collection, data, callback);
  }

  upsert(id, updateObj, callback) {
    const queryObject = { _id: id };
    this.client.upsert(this.collection, queryObject, updateObj, callback);
  }

  checkToken(id, callback) {
    const queryObject = { '_id': id };
    return this.client.exist(this.collection, queryObject, function (err, res) {
      if (err) {
        console.log('error in check token: ', err.message);
        callback(err);
      }
      callback(err, res);
    });
  }

  getInfoListByAddressAndType(address, type, callback) {
    const queryObject = { contract_address: address, type: type };
    const sortObject = {};
    this.client.getRecords(this.collection, queryObject, sortObject, 0, 0, callback);
  }

  getInfoListByAddressAndTokenId(address, tokenId, page = 0, limit = 0, callback) {
    const queryObject = { contract_address: address };
    const sortObject = { timestamp: -1 };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.getRecords(this.collection, queryObject, sortObject, page, limit, callback);
  }

  getRecordsNumberByAddressAndTokenId(address, tokenId, callback) {
    const queryObject = { contract_address: address };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.getTotal(this.collection, queryObject, callback);
  }

  getInfoListByAccountAndType(address, type, page = 0, limit = 0, callback) {
    const queryObject = {
      $or: [
        { from: address, type: type },
        { to: address, type: type }
      ]
    };
    const sortObject = { timestamp: -1 };
    this.client.getRecords(this.collection, queryObject, sortObject, page, limit, callback);
  }

  getRecordsNumberByAccountAndType(address, type, callback) {
    const queryObject = {
      $or: [
        { from: address, type: type },
        { to: address, type: type }
      ]
    };
    this.client.getTotal(this.collection, queryObject, callback);
  }

  getInfoListByDays(address, type, target, days, callback) {
    const startTime = ~~(+new Date() / 1000) - days * 24 * 60 * 60 + "";
    let queryObject = { to: address, type: type, timestamp: { $gte: startTime } };
    if (target === 'out') {
      queryObject = { from: address, type: type, timestamp: { $gte: startTime } };
    } else if (target === 'both') {
      queryObject = {
        $or: [
          { from: address, type: type, timestamp: { $gte: startTime } },
          { to: address, type: type, timestamp: { $gte: startTime } }
        ]
      };
    }
    const sortObject = { timestamp: -1 };
    this.client.getRecords(this.collection, queryObject, sortObject, 0, 0, callback);
  }
}