//------------------------------------------------------------------------------
//  DAO for token summary
//------------------------------------------------------------------------------

module.exports = class TokenSummaryDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'tokenSummary';
  }

  upsert(updateObj, callback) {
    const queryObject = { _id: updateObj._id };
    this.client.upsert(this.collection, queryObject, updateObj, callback);
  }

  getInfoByAddress(address, callback) {
    const queryObject = { _id: address };
    this.client.findOne(this.collection, queryObject, callback);
  }
}