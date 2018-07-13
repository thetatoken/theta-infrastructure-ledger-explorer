var path = require('path');

//------------------------------------------------------------------------------
//  DAO for chain status
//------------------------------------------------------------------------------

module.exports = class ProgressDAO {

  constructor(execDir, client) {
    console.log(path.join(execDir, 'node_modules', 'aerospike'))
    this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.progressInfoSet = 'progress';
    this.upsertPolicy = new this.aerospike.WritePolicy({
      exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertProgress(network, block_height, count, callback) {
    let bins = {
      'network': network,
      'lst_blk_height': block_height,
      // 'lst_blk_height': 455835,
      'txs_count': count
    }
    this.client.tryQuery(this.progressInfoSet, network, bins, {}, this.upsertPolicy, callback, 'put');
  }

  getProgress(network, callback) {
    this.client.tryQuery(this.progressInfoSet, network, null, function (error, record) {
      if (error) {
        console.log(error);
        callback(error);
      } else {
        var progressInfo = {};
        progressInfo.height = record.bins.lst_blk_height;
        progressInfo.count = record.bins.txs_count;
        callback(error, progressInfo);
      }
    }, 'get');
  }
}