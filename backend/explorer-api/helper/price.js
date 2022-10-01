/* Example in Node.js ES6 using request-promise */

exports.updatePrice = function (priceDao, config) {
  const rp = require('request-promise');
  const { key, thetaId, tfuelId, tdropId } = config;
  const ids = thetaId + ',' + tfuelId + ',' + tdropId;
  console.log(`key, ids:`, key, thetaId, tfuelId, tdropId, ids);

  const requestOptions = {
    method: 'GET',
    uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    qs: {
      'id': ids
    },
    headers: {
      'X-CMC_PRO_API_KEY': key
    },
    json: true,
    gzip: true
  };

  // return rp(requestOptions);
  let res = [];
  return rp(requestOptions).then(response => {
    Object.keys(response.data).forEach(key => {
      const info = response.data[key];
      const price = {
        "name": info.symbol,
        'price': info.quote['USD'].price,
        'volume_24h': info.quote['USD'].volume_24h,
        'market_cap': info.quote['USD'].market_cap ? info.quote['USD'].market_cap : info.quote['USD'].price * info.total_supply,
        'total_supply': info.total_supply,
        'circulating_supply': info.circulating_supply,
        'last_updated': new Date().toISOString()
      }
      priceDao.upsertPriceAsync(price);
      res.push(price);
    })
    return res;
  }).catch((err) => {
    console.log('API call error:', err.message);
    return err;
  });
}