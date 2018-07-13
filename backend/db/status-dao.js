//------------------------------------------------------------------------------
//  DAO for chain status
//------------------------------------------------------------------------------

module.exports = class StatusDAO {

  constructor(execDir, client) {
    this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));

    this.client = client;
    this.statusInfoSet = 'status';
    this.upsertPolicy = new this.aerospike.WritePolicy({
      exists: this.aerospike.policy.exists.CREATE_OR_REPLACE
    });
  }

  upsertStatus(statusInfo, callback) {
    let bins = {
      'network':         statusInfo.network,
      'lst_blk_hash':    statusInfo.latest_block_hash,
      'lst_app_hash':    statusInfo.latest_app_hash,
      'lst_blk_time':    statusInfo.latest_block_time,
      'lst_blk_ht':      statusInfo.latest_block_height
    }
    this.client.tryQuery(this.statusInfoSet, statusInfo.network, bins, {}, this.upsertPolicy, callback, 'put');
  }

  getStatus(network, callback) {
    this.client.tryQuery(this.statusInfoSet, network, null, function (error, record) {
      if (error) {
        console.log('status dao catch')
        console.log(error);
      } else {
        var statusInfo = {};
        statusInfo.network              = record.bins.network;
        statusInfo.latest_block_hash    = record.bins.lst_blk_hash;
        statusInfo.latest_app_hash      = record.bins.lst_app_hash;
        statusInfo.latest_block_time    = record.bins.lst_blk_time;
        statusInfo.latest_block_height  = record.bins.lst_blk_ht;
        callback(statusInfo);
      }
    }, 'get');
  }
}