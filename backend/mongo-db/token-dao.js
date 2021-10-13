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

  getInfoListByNameAndTokenId(name, tokenId, page = 0, limit = 0, callback) {
    const queryObject = { name: name };
    if (tokenId !== undefined) queryObject.tokenId = tokenId;
    this.client.getRecords(this.collection, queryObject, {}, page, limit, callback);
  }
}