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

  getAllIds(callback) {
    let projectionObject = { _id: 1 };
    this.client.queryWithProjection(this.collection, {}, projectionObject, callback);
  }

  getRecords(queryObject, callback) {
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }
}