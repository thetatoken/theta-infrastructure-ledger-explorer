var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var supplyRouter = (app, priceDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to get total amount of Theta
  router.get("/supply/theta", (req, res) => {
    console.log('Querying the total amount of Theta.');
    priceDao.getPriceAsync()
      .then(async priceListInfo => {
        const data = getSupplyData(priceListInfo, 'THETA')
        res.status(200).send(data);
      }).catch(async error => {
        if (error.message.includes('NOT_FOUND')) {
          const priceListInfo = await priceHelper.updatePrice(priceDao, config.coinmarketcap);
          const data = getSupplyData(priceListInfo, 'THETA');
          res.status(200).send(data);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  // The api to get total amount of TFuel
  router.get("/supply/tfuel", (req, res) => {
    console.log('Querying the total amount of Tfuel.');
    priceDao.getPriceAsync()
      .then(async priceListInfo => {
        const data = getSupplyData(priceListInfo, 'TFUEL')
        res.status(200).send(data);
      }).catch(async error => {
        if (error.message.includes('NOT_FOUND')) {
          const priceListInfo = await priceHelper.updatePrice(priceDao, config.coinmarketcap);
          const data = getSupplyData(priceListInfo, 'TFUEL');
          res.status(200).send(data);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = supplyRouter;

function getSupplyData(priceListInfo, type) {
  let total_supply = type === 'THETA' ? 1000000000 : 5000000000;
  let circulation_supply = type === 'THETA' ? 1000000000 : 5000000000;
  priceListInfo.forEach(info => {
    if (info._id === type) {
      total_supply = info.total_supply;
      circulation_supply = info.circulating_supply;
    }
  })
  const data = ({ total_supply, circulation_supply });
  return data;
}