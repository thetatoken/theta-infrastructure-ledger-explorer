var Aerospike = require('aerospike')

//------------------------------------------------------------------------------
//  DAO for block
//------------------------------------------------------------------------------

module.exports = class BlockDAO {

  constructor(client) {
    this.client = client;
    this.blockInfoSet = 'block';
    this.upsertPolicy = new Aerospike.WritePolicy({
      exists: Aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertBlock(blockInfo, callback) {
    let bins = {
      'height':       blockInfo.height,
      'timestamp':    blockInfo.timestamp,
      'hash':         blockInfo.hash,
      'parent_hash':  blockInfo.parent_hash,
      'num_txs':      blockInfo.num_txs,
      'lst_cmt_hash': blockInfo.lst_cmt_hash,
      'data_hash':    blockInfo.data_hash,
      'vldatr_hash':  blockInfo.vldatr_hash,
      'txs':          blockInfo.txs
    }

    this.client.put(this.blockInfoSet, blockInfo.height, bins, {}, this.upsertPolicy, callback);
  }

  getBlock(height, callback) {
    this.client.get(this.blockInfoSet, height, null, function (error, record) {
      if (error) {
        console.log(error);
      } else {
        var blockInfo = {};
        blockInfo.height      = record.bins.height;
        blockInfo.timestamp   = record.bins.timestamp;
        blockInfo.hash        = record.bins.hash;
        blockInfo.parent_hash = record.bins.parent_hash;
        callback(blockInfo);
      }
    });
  }

}