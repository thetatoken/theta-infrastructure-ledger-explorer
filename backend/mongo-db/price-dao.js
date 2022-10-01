//------------------------------------------------------------------------------
//  DAO for price
//------------------------------------------------------------------------------
const redis_key = 'price';

module.exports = class priceDAO {

  constructor(execDir, client, redis) {
    this.client = client;
    this.priceInfoCollection = 'price';
    this.redis = redis;
  }

  upsertPrice(priceInfo, callback) {
    // console.log('priceInfo in upsert:', priceInfo)
    let self = this;
    const redis_field = priceInfo.name;
    const newObject = {
      '_id': priceInfo.name,
      'price': priceInfo.price,
      'volume_24h': priceInfo.volume_24h,
      'market_cap': priceInfo.market_cap,
      'total_supply': priceInfo.total_supply,
      'circulating_supply': priceInfo.circulating_supply,
      'last_updated': priceInfo.last_updated
    }
    const queryObject = { '_id': priceInfo.name };
    this.client.upsert(this.priceInfoCollection, queryObject, newObject, function (error, record) {
      if (error) {
        console.log('Price dao upsertPrice ERR - ', error);
        callback(error);
      } else {
        newObject._id = priceInfo.name;
        if (self.redis !== null) {
          self.redis.hset(redis_key, redis_field, JSON.stringify(newObject))
        }
        callback(error, record);
      }
    });
  }

  async getPrice(callback) {
    let self = this;
    if (this.redis !== null) {
      let list = [];
      try {
        list = await this.redis.hmget(redis_key, 'THETA', 'TFUEL');
      } catch (e) {
        // console.log('Redis get price met error:', e);
        query();
      }
      if (list[0] && list[1]) {
        // console.log('Redis get price returns.');
        const records = list.map(obj_str => JSON.parse(obj_str))
        callback(null, records);
        return;
      }
      query();
    } else {
      query();
    }

    function query() {
      const queryObject = { '_id': { $in: ['THETA', 'TFUEL', 'TDROP'] } };
      self.client.query(self.priceInfoCollection, queryObject, function (error, recordList) {
        if (error) {
          console.log('Price dao getPrice ERR -', error);
          callback(error);
        } else if (!recordList || recordList.length === 0) {
          callback(Error('NOT_FOUND - Prices'));
        } else {
          if (self.redis !== null) {
            self.redis.hmset(redis_key, 'THETA', JSON.stringify(recordList[0]), 'TFUEL', JSON.stringify(recordList[1]));
          }
          callback(error, recordList)
        }
      })
    }
  }
}