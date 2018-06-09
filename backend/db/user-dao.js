var path = require('path');

//------------------------------------------------------------------------------
//  DAO for transaction
//------------------------------------------------------------------------------

module.exports = class TransactionDAO {

  constructor(execDir, client) {
    this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.userInfoSet = 'user';
    this.upsertPolicy = new this.aerospike.WritePolicy({
      exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertUser(userInfo, callback) {
    let bins = {
      'address': userInfo.address,
      'balance': userInfo.balance
    }
    this.client.put(this.userInfoSet, bins.address, bins, {}, this.upsertPolicy, callback);
  }
  checkUser(pk, callback){
    return this.client.exists(this.userInfoSet, pk, (err, res) => {
      callback(err, res)
    })
  }

  getUserByPk(pk, callback) {
    this.client.get(this.userInfoSet, pk, function (error, record) {
      if (error) {
        switch (error.code) {
          // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
          // No record is found with the specified namespace/set/key combination.
          case 2:
            console.log('NOT_FOUND -', pk)
            callback(error);
            break
          default:
            console.log('ERR - ', error, uuid)
        }
      } else {
        var userInfo = {};
        userInfo.address = record.bins.address;
        userInfo.balance = record.bins.balance;
        callback(error, userInfo);
      }
    });
  }

}