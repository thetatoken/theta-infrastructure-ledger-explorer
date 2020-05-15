/* Example in Node.js ES6 using request-promise */

exports.updatePrice = function (priceDao, config) {
  const rp = require('request-promise');
  const { key, theta_id, tfuel_id } = config;
  const ids = theta_id + ',' + tfuel_id;
  console.log(`key, ids:`, key, theta_id, tfuel_id, ids);

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
        'market_cap': info.quote['USD'].market_cap,
        'total_supply': info.total_supply,
        'circulating_supply': info.circulating_supply,
        'last_updated': info.last_updated
      }
      priceDao.upsertPriceAsync(price);
      res.push(price);
    })
    return res;
  }).catch((err) => {
    console.log('API call error:', err.message);
    return res;
  });
}