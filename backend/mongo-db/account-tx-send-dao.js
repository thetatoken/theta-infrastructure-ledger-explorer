//------------------------------------------------------------------------------
//  DAO for account transaction history
//------------------------------------------------------------------------------

module.exports = class AccountTxDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'accountTxSend';
  }

  upsertInfo(info, callback) {
    const newObject = {
      'tx_type': info.tx_type,
      'timestamp': info.timestamp
    }
    const queryObject = { '_id': info.address + '_' + info.tx_hash };
    this.client.upsert(this.collection, queryObject, newObject, callback);
  }

  getInfoList(address, pageNumber, limitNumber, diff, callback) {
    const pattern = `^${address}_`;
    const queryObject = { '_id': { '$regex': pattern, $options: 'i' } };
    const sortObject = { 'timestamp': -1 };
    // const sortObject = { 'timestamp': diff === null ? -1 : 1 };
    // pageNumber = diff ? 0 : pageNumber;
    // limitNumber = diff ? diff : limitNumber;
    this.client.getRecords(this.collection, queryObject, sortObject, pageNumber, limitNumber, callback, diff);
  }

}