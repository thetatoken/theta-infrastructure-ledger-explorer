//------------------------------------------------------------------------------
//  DAO for token holder
//  Require index: `db.tokenHolder.createIndex({contract_address:1, token_id:1})`
//  Require index: `db.tokenHolder.createIndex({contract_address:1, token_id:1, holder:1})`
//  Require index: `db.tokenHolder.createIndex({contract_address:1, token_id:1, amount: 1})`
//  Require index: `db.tokenHolder.createIndex({contract_address:1, holder:1})`
//------------------------------------------------------------------------------

module.exports = class TokenHolderDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'tokenHolder';
  }

  insert(data, callback) {
    this.client.insert(this.collection, data, callback);
  }

  upsert(updateObj, callback) {
    const queryObject = { _id: updateObj._id };
    this.client.upsert(this.collection, queryObject, updateObj, callback);
  }

  getAmount(address, holder, tokenId, callback) {
    const queryObject = { contract_address: address, holder: holder };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.findOne(this.collection, queryObject, callback);
  }

  getInfoByAddressAndHolderList(address, tokenId, holderList, callback) {
    const queryObject = { contract_address: address, holder: { $in: holderList } };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }

  getHolderList(address, tokenId, callback) {
    const queryObject = { contract_address: address };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.getRecords(this.collection, queryObject, {}, 0, 0, callback);
  }

  removeRecordById(id, callback) {
    const queryObject = { _id: id };
    this.client.remove(this.collection, queryObject, callback);
  }

  removeRecordByAdressAndHolderList(address, tokenId, holderList, callback) {
    const queryObject = { contract_address: address, holder: { $in: holderList } };
    if (tokenId != null) queryObject.token_id = tokenId;
    this.client.remove(this.collection, queryObject, callback);
  }
}