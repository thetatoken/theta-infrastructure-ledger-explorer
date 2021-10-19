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
    // TODOs: Remove the template after implement upsert function
    // this.client.findOne(this.collection, queryObject, function (error, record) {
    //   callback(error, {
    //     "_id": address,
    //     "holders_number": 1000,
    //     "max_total_supply": 1000000,
    //     "total_transfers": 60,
    //   })
    // });
  }
}