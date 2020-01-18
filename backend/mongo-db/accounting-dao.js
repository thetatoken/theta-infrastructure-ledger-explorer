var path = require('path');

//------------------------------------------------------------------------------
//  DAO for accounting purposes
//------------------------------------------------------------------------------

module.exports = class AccountTxDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'accounting';
  }

  insert(rec, callback) {
    this.client.insert(this.collection, rec, callback);
  }

}