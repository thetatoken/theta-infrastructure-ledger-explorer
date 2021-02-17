var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');


var supplyRouter = (app, progressDao, rpc, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to get total amount of Theta
  router.get("/supply/theta", (req, res) => {
    console.log('Querying the total amount of Theta.');
    const data = ({
      "total_supply": 1000000000,
      "circulation_supply": 1000000000
    });
    res.status(200).send(data);
  });

  // The api to get total amount of TFuel
  router.get("/supply/tfuel", (req, res) => {
    console.log('Querying the total amount of Tfuel.');
    if (config.blockchain.network_id !== 'main_net_chain') {
      const data = ({
        "total_supply": 5000000000,
        "circulation_supply": 5000000000
      });
      res.status(200).send(data);
      return;
    }
    progressDao.getProgressAsync(config.blockchain.network_id)
      .then(progressInfo => {
        const height = progressInfo.height;
        const supply = 5000000000 + ~~((height - 4164982) / 100) * 4800;
        const data = ({
          "total_supply": supply,
          "circulation_supply": supply
        })
        res.status(200).send(data);
      }).catch(err => {
        res.status(400).send(err.message);
      })
  });

  router.get("/supply/tfuel/burnt", async (req, res) => {
    console.log('Querying the total Tfuel burnt amount.');
    try {
      let response = await rpc.getAccountAsync([{ 'address': '0x0' }]);
      let account = JSON.parse(response).result;
      const addressZeroBalance = account ? account.coins.tfuelwei : 0;
      const feeInfo = await progressDao.getFeeAsync()
      const burntAmount = helper.sumCoin(addressZeroBalance, feeInfo.total_fee).toFixed();
      const data = ({
        "address_zero_tfuelwei_balance": addressZeroBalance,
        "total_tfuelwei_burnt_as_transaction_fee": feeInfo.total_fee,
        "total_tfuelwei_burnt": burntAmount,
      })
      res.status(200).send(data);
    } catch (err) {
      res.status(400).send(err.message);
    }
  })
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = supplyRouter;