var path = require('path');

//------------------------------------------------------------------------------
//  DAO for transaction
//------------------------------------------------------------------------------

module.exports = class AccountDAO {

  constructor(execDir, client) {
    // this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.accountInfoCollection = 'account';
  }

  upsertAccount(accountInfo, callback) {
    // console.log('accountInfo in upsert:', accountInfo)
    const newObject = {
      'address': accountInfo.address.toUpperCase(),
      'balance': accountInfo.balance,
      'sequence': accountInfo.sequence,
      'reserved_funds': accountInfo.reserved_funds === null ? 'null' : accountInfo.reserved_funds,
      'lst_updt_blk': accountInfo.last_updated_block_height,
      'txs_hash_list': accountInfo.txs_hash_list
    }
    const queryObject = { 'address': newObject.address };
    this.client.upsert(this.accountInfoCollection, queryObject, newObject, callback);
  }
  checkAccount(address, callback) {
    const queryObject = { 'address': address };
    return this.client.exist(this.accountInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('error in checkAccount: ', err);
        throw err;
      }
      callback(err, res);
    });
  }
  getAccountByPk(address, callback) {
    const queryObject = { 'address': address };
    this.client.findOne(this.accountInfoCollection, queryObject, function (error, record) {
      if (error) {
        switch (error.code) {
          // TODO: check the  not found error code in mongoDc
          case 2:
            console.log('NOT_FOUND -', pk)
            callback(error);
            break
          default:
            console.log('ERR - ', error, pk)
        }
      } else {
        // console.log('account info in record: ', record)
        var accountInfo = {};
        accountInfo.address = record.address;
        accountInfo.balance = record.balance;
        accountInfo.sequence = record.sequence;
        accountInfo.reserved_funds = record.reserved_funds;
        accountInfo.last_updated_block_height = record.lst_updt_blk;
        accountInfo.txs_hash_list = record.txs_hash_list;
        callback(error, accountInfo);
      }
    })
  }
  //   getAccountByPk(pk, callback) {
  //     this.client.tryQuery(this.accountInfoCollection, pk.toUpperCase(), function (error, record) {
  //       if (error) {
  //         switch (error.code) {
  //           // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
  //           // No record is found with the specified namespace/set/key combination.
  //           case 2:
  //             console.log('NOT_FOUND -', pk)
  //             callback(error);
  //             break
  //           default:
  //             console.log('ERR - ', error, pk)
  //         }
  //       } else {
  //         var accountInfo = {};
  //         accountInfo.address = record.bins.address;
  //         accountInfo.balance = record.bins.balance;
  //         accountInfo.sequence = record.bins.sequence;
  //         accountInfo.reserved_funds = record.bins.reserved_funds;
  //         accountInfo.last_updated_block_height = record.bins.lst_updt_blk;
  //         accountInfo.txs_hash_list = record.bins.txs_hash_list;
  //         callback(error, accountInfo);
  //       }
  //     }, 'get');
  //   }

}