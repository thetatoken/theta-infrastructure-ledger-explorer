//------------------------------------------------------------------------------
//  DAO for account transaction history
//  Require index: `db.acctTx.createIndex({acct:1, hash:1})`
//  Require index: `db.acctTx.createIndex({acct:1, ts:1})`
//  Require index: `db.acctTx.createIndex({acct:1, type:1,ts:1})`
//------------------------------------------------------------------------------

module.exports = class AccountTxDAO {

  constructor(execDir, client) {
    this.client = client;
    this.accountTxInfoCollection = 'accountTx'; // deprecated
    this.collection = 'acctTx';
  }

  insert(tx, callback) {
    this.client.insert(this.collection, tx, callback);
  }

  /** @deprecated*/
  upsertInfo(info, callback) {
    const newObject = {
      'tx_type': info.tx_type,
      'timestamp': info.timestamp
    }
    const queryObject = { '_id': info.address + '_' + info.tx_hash };
    this.client.upsert(this.accountTxInfoCollection, queryObject, newObject, callback);
  }

  getList(address, type, isEqualType, pageNumber, limitNumber, reverse, callback) {
    const typeObject = isEqualType === 'true' ? (Array.isArray(type) ? { $in: type } : type) : { $ne: type };
    const queryObject = { acct: address, type: typeObject };
    const sortObject = { ts: reverse ? 1 : -1 };
    this.client.getRecords(this.collection, queryObject, sortObject, pageNumber, limitNumber, callback);
  }

  getListByTime(address, startTime, endTime, types, callback) {
    let queryObject;
    if (types === null) {
      queryObject = { acct: address, ts: { $gte: startTime, $lte: endTime } };
    } else {
      queryObject = { acct: address, type: { $in: types }, ts: { $gte: startTime, $lte: endTime } };
    }
    this.client.getRecords(this.collection, queryObject, {}, 0, 5000, callback);
  }
  getAllRecordsByTime(startTime, endTime, callback) {
    const queryObject = { ts: { $gte: startTime, $lte: endTime } };
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }

  getTxHashes(address, startTime, endTime, type, callback) {
    let queryObj;
    if (type === null) {
      queryObj = { acct: address, ts: { $gte: startTime, $lt: endTime } };
    } else {
      queryObj = { acct: address, type: type, ts: { $gte: startTime, $lt: endTime } };
    }
    let projectionObj = { hash: 1, _id: 0 };
    this.client.queryWithProjection(this.collection, queryObj, projectionObj, callback);
  }

  getCount(address, type, isEqualType, startTime, endTime, callback) {
    const typeObject = isEqualType === 'true' ? type : { $ne: type };
    const queryObject = { acct: address, type: typeObject, ts: { $gte: startTime, $lte: endTime } };
    this.client.getTotal(this.collection, queryObject, callback);
  }


  getInfoListByType(address, type, isEqualType, pageNumber, limitNumber, diff, callback) {
    const pattern = `^${address}_`;
    const typeObject = isEqualType === 'true' ? type : { $ne: type };
    const queryObject = { '_id': { '$regex': pattern, $options: 'i' }, 'tx_type': typeObject };
    const sortObject = { 'timestamp': -1 };
    // const sortObject = { 'timestamp': diff === null ? -1 : 1 };
    // pageNumber = diff ? 0 : pageNumber;
    // limitNumber = diff ? diff : limitNumber;
    this.client.getRecords(this.accountTxInfoCollection, queryObject, sortObject, pageNumber, limitNumber, callback, diff);
  }

  getInfoTotal(address, type, isEqualType, startTime, endTime, callback) {
    const pattern = `^${address}_`;
    const typeObject = isEqualType === 'true' ? type : { $ne: type };
    const queryObject = { '_id': { '$regex': pattern, $options: 'i' }, 'tx_type': typeObject, timestamp: { $gte: startTime, $lte: endTime } };
    this.client.getTotal(this.accountTxInfoCollection, queryObject, callback);
  }

  getInfoListByTime(address, startTime, endTime, type, callback) {
    const pattern = `^${address}_`;
    let queryObject;
    if (type === null) {
      queryObject = { '_id': { '$regex': pattern, $options: 'i' }, timestamp: { $gte: startTime, $lte: endTime } };
    } else {
      queryObject = { '_id': { '$regex': pattern, $options: 'i' }, 'tx_type': type, timestamp: { $gte: startTime, $lte: endTime } };
    }
    this.client.getRecords(this.accountTxInfoCollection, queryObject, {}, 0, 0, callback);
  }
}