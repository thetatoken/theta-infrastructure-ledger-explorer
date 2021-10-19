//------------------------------------------------------------------------------
//  DAO for token
//------------------------------------------------------------------------------

module.exports = class TotalAccountDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'token';
  }

  insert(data, callback) {
    this.client.insert(this.collection, data, callback);
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

  getInfoListByAddressAndTokenId(address, tokenId, page = 0, limit = 0, callback) {
    const queryObject = { contract_address: address };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.getRecords(this.collection, queryObject, {}, page, limit, callback);
  }

  getRecordsNumberByAddressAndTokenId(address, tokenId, callback) {
    const queryObject = { contract_address: address };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.getTotal(this.collection, queryObject, callback);
  }
}