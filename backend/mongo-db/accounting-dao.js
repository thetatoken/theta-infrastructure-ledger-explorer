//------------------------------------------------------------------------------
//  DAO for accounting purposes
//  Require index: `db.accounting.createIndex( { addr: 1, date: 1 } )`
//------------------------------------------------------------------------------

module.exports = class AccountTxDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'accounting';
  }

  insert(rec, callback) {
    this.client.insert(this.collection, rec, callback);
  }

  upsert(queryObj, updateObj, callback) {
    this.client.upsert(this.collection, queryObj, updateObj, callback);
  }

  get(wallet, startDate, endDate, callback) {
    let queryObj = { addr: wallet, date: { $gte: startDate, $lt: endDate } };
    let projectionObj = { _id: 0 };
    this.client.queryWithProjection(this.collection, queryObj, projectionObj, callback);
  }
}