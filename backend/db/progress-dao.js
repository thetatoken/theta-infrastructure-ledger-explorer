var Aerospike = require('aerospike')

//------------------------------------------------------------------------------
//  DAO for chain status
//------------------------------------------------------------------------------

module.exports = class ProgressDAO {

  constructor(client) {
    this.client = client;
    this.progressInfoSet = 'progress';
    this.upsertPolicy = new Aerospike.WritePolicy({
      exists: Aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertProgress(network, block_height, callback) {
    let bins = {
      'network':         network,
      'lst_blk_height':  block_height
    }
    this.client.put(this.progressInfoSet, network, bins, {}, this.upsertPolicy, callback);
  }

  getProgress(network, callback) {
    this.client.get(this.progressInfoSet, network, null, callback);    
  }
}