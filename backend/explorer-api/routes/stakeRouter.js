var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var BigNumber = require('bignumber.js');

var stakeRouter = (app, stakeDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/stake/all", (req, res) => {
    console.log('Querying all stake.');
    stakeDao.getAllStakesAsync()
      .then(stakeListInfo => {
        const data = ({
          type: 'stake',
          body: stakeListInfo,
        });
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  router.get("/stake/totalAmount", (req, res) => {
    console.log('Querying total staked tokens.');
    stakeDao.getAllstakeAsync()
      .then(stakeListInfo => {
        let total = 0;
        stakeListInfo.forEach(info => {
          total = helper.sumCoin(total, info.amount)
        });
        const data = ({
          type: 'stakeTotalAmout',
          body: { totalAmount: total.toFixed() },
        });
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  router.get("/stake/:id", (req, res) => {
    console.log('Querying stake by address.');
    const address = req.params.id.toLowerCase();
    stakeDao.getStakeByAddressAsync(address)
      .then(stakeListInfo => {
        const data = ({
          type: 'stake',
          body: stakeListInfo,
        });
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = stakeRouter;