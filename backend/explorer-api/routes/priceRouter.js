var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var priceHelper = require('../helper/price');

var priceRouter = (app, priceDao, progressDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/price/all", (req, res) => {
    console.log('Querying all price.');
    priceDao.getPriceAsync()
      .then(async priceListInfo => {
        let isOutDated = false;
        const time = new Date();
        priceListInfo.forEach(info => {
          const timestamp = new Date(info.last_updated).getTime()
          isOutDated = isOutDated || time - timestamp > 1000 * 60 * 10;
        })
        if (isOutDated) {
          let tmp = await priceHelper.updatePrice(priceDao, config.coinmarketcap);
          if (!tmp.error) {
            priceListInfo = tmp;
            priceListInfo.forEach(p => p._id = p.name)
          }
        }
        await updateSupply(priceListInfo, progressDao, config);
        const data = ({
          type: 'price',
          body: priceListInfo,
        });
        res.status(200).send(data);
      })
      .catch(async error => {
        if (error.message.includes('NOT_FOUND')) {
          const priceListInfo = await priceHelper.updatePrice(priceDao, config.coinmarketcap);
          await updateSupply(priceListInfo, progressDao, config);
          const data = ({
            type: 'price',
            body: priceListInfo,
          });
          res.status(200).send(data);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = priceRouter;

async function updateSupply(priceListInfo, progressDao, config) {
  if (config.blockchain.network_id !== 'main_net_chain') return;
  for (let info of priceListInfo) {
    if (info._id === 'TFUEL') {
      let progressInfo = await progressDao.getProgressAsync(config.blockchain.network_id);
      const height = progressInfo.height;
      const supply = 5000000000 + ~~((height - 4164982) / 100) * 4800;
      info.total_supply = supply;
      info.circulating_supply = supply;
    }
  }
}