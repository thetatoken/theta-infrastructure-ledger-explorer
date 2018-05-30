var path = require('path');

//------------------------------------------------------------------------------
//  DAO for chain status
//------------------------------------------------------------------------------

module.exports = class txsProgressDAO {

  constructor(execDir, client) {
    console.log(path.join(execDir, 'node_modules', 'aerospike'))
    this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.progressInfoSet = 'transaction-progress';
    this.upsertPolicy = new this.aerospike.WritePolicy({
      exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertProgress(network, block_height, callback) {
    let bins = {
      'network':         network,
      'lst_blk_height':  block_height,
    //   'lst_blk_height': 4140000
    }
    this.client.put(this.progressInfoSet, network, bins, {}, this.upsertPolicy, callback);
  }

  getProgress(network, callback) {
    this.client.get(this.progressInfoSet, network, null, function(error, record) {
      if (error) {
        console.log(error);
        callback(error);
      } else {
        var progressInfo = {};
        progressInfo.height = record.bins.lst_blk_height;
        callback(error, progressInfo);
      }
    });
  }
}