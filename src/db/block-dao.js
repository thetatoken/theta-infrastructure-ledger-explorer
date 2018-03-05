// aerospike client module

const Aerospike = require('aerospike')

//------------------------------------------------------------------------------
//  Initialization
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
      'time_stamp':   blockInfo.timeStamp,
      'hash':         blockInfo.hash,
      'parent_hash':  blockInfo.parentHash,
      //'num_tx':       blockInfo.transactions.length();
    }
    this.client.put(this.blockInfoSet, blockInfo.height, bins, {}, this.upsertPolicy, callback)
  }

  getBlock(height, callback) {
    this.client.get(this.blockInfoSet, height, null, callback)
  }

}