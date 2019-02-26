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
      // 'lst_updt_blk': accountInfo.last_updated_block_height,
      'txs_hash_list': accountInfo.txs_hash_list
    }
    const queryObject = { '_id': newObject.address };
    this.client.upsert(this.accountInfoCollection, queryObject, newObject, callback);
  }
  checkAccount(address, callback) {
    const queryObject = { '_id': address };
    return this.client.exist(this.accountInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('error in checkAccount: ', err);
        callback(err);
      }
      callback(err, res);
    });
  }
  getTotalNumber(callback) {
    this.client.getTotal(this.accountInfoCollection, function (error, record) {
      if (error) {
        console.log('ERR - ', error, address);
      } else {
        callback(error, record);
      }
    });
  }
  getAccountByPk(address, callback) {
    const queryObject = { '_id': address };
    this.client.findOne(this.accountInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error, address);
        // callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND - ' + address));
      } else {
        // console.log('account info in record: ', record)
        var accountInfo = {};
        accountInfo.address = record.address;
        accountInfo.balance = record.balance;
        accountInfo.sequence = record.sequence;
        accountInfo.reserved_funds = record.reserved_funds;
        // accountInfo.last_updated_block_height = record.lst_updt_blk;
        accountInfo.txs_hash_list = record.txs_hash_list;
        callback(error, accountInfo);
      }
    })
  }

}