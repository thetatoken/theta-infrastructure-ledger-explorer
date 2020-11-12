var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var BigNumber = require('bignumber.js');

var stakeRouter = (app, stakeDao, accountDao, progressDao) => {
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
    progressDao.getStakeProgressAsync()
      .then(info => {
        const data = ({
          type: 'stakeTotalAmout',
          body: { totalAmount: info.total_amount, totalNodes: info.holder_num },
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
    let { hasBalance = false } = req.query;
    const address = helper.normalize(req.params.id.toLowerCase());
    if(!helper.validateHex(address, 40)){
      res.status(400).send({type: 'invalid_address'})
      return;
    }
    stakeDao.getStakeByAddressAsync(address)
      .then(async stakeListInfo => {
        // TODO: Remove retry after fix the stake issue
        if (stakeListInfo.holderRecords.length === 0 && stakeListInfo.sourceRecords.length === 0) {
          stakeListInfo = await stakeDao.getStakeByAddressAsync(address);
        }
        if (hasBalance === 'true') {
          for (let i = 0; i < stakeListInfo.holderRecords.length; i++) {
            if (stakeListInfo.holderRecords[i].type === 'gcp') {
              const accInfo = await accountDao.getAccountByPkAsync(stakeListInfo.holderRecords[i].source);
              stakeListInfo.holderRecords[i].source_tfuelwei_balance = accInfo.balance.tfuelwei;
            }
          }
        }
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