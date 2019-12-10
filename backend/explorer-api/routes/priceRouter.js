var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var priceHelper = require('../helper/price');

var priceRouter = (app, priceDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/price/all", (req, res) => {
    console.log('Querying all price.');
    priceDao.getPriceAsync()
      .then(async priceListInfo => {
        let isOutDated = false;
        const time = new Date();
        priceListInfo.forEach(info => {
          const timestamp = new Date(info.last_updated).getTime()
          isOutDated = isOutDated || time - timestamp > 1000 * 60 * 5;
        })
        if (isOutDated) {
          priceListInfo = await priceHelper.updatePrice(priceDao, config.coinmarketcap);
        }
        const data = ({
          type: 'price',
          body: priceListInfo,
        });
        res.status(200).send(data);
      })
      .catch(async error => {
        if (error.message.includes('NOT_FOUND')) {
          const priceListInfo = await priceHelper.updatePrice(priceDao, config.coinmarketcap);
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