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

  getInfoListByType(address, type, isEqualType, pageNumber, limitNumber, callback) {
    const pattern = `^${address}_`;
    const typeObject = isEqualType === 'true' ? type : { $ne: type };
    const queryObject = { '_id': { '$regex': pattern, $options: 'i' }, 'tx_type': typeObject };
    const sortObject = { 'timestamp': -1 };
    this.client.getRecords(this.accountTxInfoCollection, queryObject, sortObject, pageNumber, limitNumber, callback);
  }
}