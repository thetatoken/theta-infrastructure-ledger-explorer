var path = require('path');

//------------------------------------------------------------------------------
//  DAO for account transaction history
//------------------------------------------------------------------------------

module.exports = class AccountTxDAO {

  constructor(execDir, client) {
    this.client = client;
    this.accountTxInfoCollection = 'accountTx';
  }

  upsertInfo(info, callback) {
    const newObject = {
      'tx_type': info.tx_type,
      'timestamp': info.timestamp
    }
    const queryObject = { '_id': info.address + '_' + info.tx_hash };
    this.client.upsert(this.accountTxInfoCollection, queryObject, newObject, callback);
  }

  getInfoListByType(address, type, isEqualType, pageNumber, limitNumber, diff, callback) {
    console.log(diff);
    console.log(typeof diff)
    const pattern = `^${address}_`;
    const typeObject = isEqualType === 'true' ? type : { $ne: type };
    const queryObject = { '_id': { '$regex': pattern, $options: 'i' }, 'tx_type': typeObject };
    const sortObject = { 'timestamp': diff === null ? -1 : 1 };
    pageNumber = diff ? 0 : pageNumber;
    limitNumber = diff ? diff : limitNumber;
    this.client.getRecords(this.accountTxInfoCollection, queryObject, sortObject, pageNumber, limitNumber, callback);
  }

  getInfoTotal(address, type, isEqualType, callback) {
    const pattern = `^${address}_`;
    const typeObject = isEqualType === 'true' ? type : { $ne: type };
    const queryObject = { '_id': { '$regex': pattern, $options: 'i' }, 'tx_type': typeObject };
    this.client.getTotal(this.accountTxInfoCollection, queryObject, callback);
  }
}