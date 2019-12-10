var path = require('path');

//------------------------------------------------------------------------------
//  DAO for price
//------------------------------------------------------------------------------

module.exports = class priceDAO {

  constructor(execDir, client) {
    // this.aerospike = require(path.join(execDir, 'node_modules', 'aerospike'));
    this.client = client;
    this.priceInfoCollection = 'price';
  }

  upsertPrice(priceInfo, callback) {
    // console.log('priceInfo in upsert:', priceInfo)
    const newObject = {
      'price': priceInfo.price,
      'volume_24h': priceInfo.volume_24h,
      'market_cap': priceInfo.market_cap,
      'total_supply': priceInfo.total_supply,
      'circulating_supply': priceInfo.circulating_supply,
      'last_updated': priceInfo.last_updated
    }
    const queryObject = { '_id': priceInfo.name };
    this.client.upsert(this.priceInfoCollection, queryObject, newObject, callback);
  }

  getPrice(callback) {
    const queryObject = { '_id': { $in: ['THETA', 'TFUEL'] } };
    this.client.query(this.priceInfoCollection, queryObject, function (error, recordList) {
      if (error) {
        console.log('ERR - Prices:', error);
        // callback(error);
      } else if (!recordList || recordList.length === 0) {
        callback(Error('NOT_FOUND - Prices'));
      } else {
        callback(error, recordList)
      }
    })
  }
}