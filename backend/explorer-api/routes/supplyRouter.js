var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var { getMaxTotalSupply } = require('../helper/smart-contract');

var supplyRouter = (app, progressDao, dailyTfuelBurntDao, rpc, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to get total amount of Theta
  router.get("/supply/theta", (req, res) => {
    console.log('Querying the total amount of Theta.');
    const { q } = req.query;
    let data = ({
      "total_supply": 1000000000,
      "circulation_supply": 1000000000
    });
    if (q === 'totalSupply' || q === 'circulationSupply') {
      data = '1000000000';
    }
    res.status(200).send(data);
  });

  // The api to get total amount of TFuel
  router.get("/supply/tfuel", (req, res) => {
    console.log('Querying the total amount of Tfuel.');
    const { q } = req.query;
    if (config.blockchain.networkId !== 'main_net_chain') {
      let data = ({
        "total_supply": 5000000000,
        "circulation_supply": 5000000000
      });
      if (q === 'totalSupply' || q === 'circulationSupply') {
        data = '5000000000';
      }
      res.status(200).send(data);
      return;
    }
    progressDao.getProgressAsync(config.blockchain.networkId)
      .then(async progressInfo => {
        try {
          const height = progressInfo.height;
          let response = await rpc.getAccountAsync([{ 'address': '0x0' }]);
          let account = JSON.parse(response).result;
          const addressZeroBalance = account ? account.coins.tfuelwei : 0;
          const feeInfo = await progressDao.getFeeAsync()
          const burntAmount = helper.sumCoin(addressZeroBalance, feeInfo.total_fee).toFixed();
          const supply = 5000000000 + ~~((10968061 - 4164982) / 100) * 4800 + ~~((height - 10968061) / 100) * 8600 - helper.formatCoin(burntAmount).toFixed(0);
          let data = ({
            "total_supply": supply,
            "circulation_supply": supply
          })
          if (q === 'totalSupply' || q === 'circulationSupply') {
            data = supply.toString();
          }
          res.status(200).send(data);
        } catch (err) {
          res.status(400).send(err.message);
          return;
        }
      }).catch(err => {
        res.status(400).send(err.message);
      })
  });

  router.get("/supply/tdrop", async (req, res) => {
    console.log('Querying the total amount of TDrop.');
    const { q } = req.query;
    const totalSupplyAbi = [{
      "inputs": [],
      "name": "totalSupply",
      "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
      "stateMutability": "view",
      "type": "function"
    }];
    const tdropAddress = '0x1336739b05c7ab8a526d40dcc0d04a826b5f8b03';

    try {
      const totalSupplyWei = await getMaxTotalSupply(tdropAddress, totalSupplyAbi);
      const totalSupply = helper.formatCoin(totalSupplyWei).toFixed(0);
      let data = ({
        "total_supply": totalSupply,
        "circulation_supply": totalSupply
      });
      if (q === 'totalSupply') {
        data = totalSupply.toString();
      }
      res.status(200).send(data);
    } catch (err) {
      res.status(400).send(err.message);
    }

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

  router.get("/supply/dailyTfuelBurnt", async (req, res) => {
    let { timestamp = 0 } = req.query;
    if (Number.isNaN(timestamp)) {
      res.status(400).send("Wrong parameter")
    } else if (timestamp === 0) {
      dailyTfuelBurntDao.getLatestRecordAsync()
        .then(info => {
          const data = {
            type: 'daily_stake_list',
            body: info
          }
          res.status(200).send(data);
        }).catch(error => {
          res.status(404).send(error)
        })
    } else {
      dailyTfuelBurntDao.getLatestTimestampAsync(timestamp)
        .then(ts => {
          dailyTfuelBurntDao.getRecordByTimestampAsync(ts)
            .then(infoList => {
              const data = {
                type: 'daily_stake_list',
                body: infoList
              }
              res.status(200).send(data);
            }).catch(error => {
              res.status(404).send(error.message)
            })
        }).catch(error => {
          res.status(404).send(error.message)
        })
    }
  })

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = supplyRouter;