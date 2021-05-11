var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var axios = require("axios").default;
let startTime = { theta: +new Date(), tfuel: +new Date() };
const cachePeriod = 6 * 1000 // 6 seconds
let cacheData = { theta: undefined, tfuel: undefined };
var stakeRouter = (app, stakeDao, blockDao, accountDao, progressDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/stake/all", (req, res) => {
    console.log('Querying all stake.');
    let { types = ['vcp', 'gcp'] } = req.query;
    stakeDao.getAllStakesByTypesAsync(types)
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
  //TODO: remove after merge 3.0 branch
  router.get("/stake/totalAmount/tfuel", async (req, res) => {
    console.log('Querying total staked tfuel tokens.');
    axios.get(`https://api.thetatoken.org/v1/pre-elite-edge-nodes/stats`)
      .then(result => {
        const data = ({
          type: 'total_staked_tfuel',
          body: {
            total_tfuel_staked: result.data.total_tfuel_staked
          }
        })
        res.status(200).send(data)
      })
      .catch(error => {
        console.log('error:', error)
        res.status(400).send(error);
      })
  })
  router.get("/stake/totalAmount", (req, res) => {
    let { type = 'theta' } = req.query;
    console.log(`Querying total staked ${type} tokens.`);
    if (type !== 'theta' && type !== 'tfuel') {
      res.status(400).send('Wrong parameter.');
      return;
    }
    let cur = +new Date();
    if (cur - startTime[type] < cachePeriod && cacheData && cacheData[type]) {
      const data = cacheData[type];
      if (data.type === 'stakeTotalAmout') {
        res.status(200).send(data);
      } else if (data.type === 'error_not_found') {
        res.status(404).send(data);
      }
      return;
    }
    startTime[type] = cur;
    progressDao.getStakeProgressAsync(type)
      .then(info => {
        const data = ({
          type: 'stakeTotalAmout',
          body: { totalAmount: info.total_amount, totalNodes: info.holder_num, type: info.type },
        });
        cacheData[type] = data;
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          cacheData[type] = err;
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });
  });

  router.get("/stake/returnTime", async (req, res) => {
    let { return_height = 0 } = req.query;
    return_height = Number(return_height);
    if (return_height === 0) res.status(400).send('invalid_parameter');
    const network_id = config.blockchain.network_id;
    try {
      const progressInfo = await progressDao.getProgressAsync(network_id);
      const cur_height = progressInfo.height;
      let time = 0;
      if (cur_height < return_height) {
        const num_blocks_past_24_hours = await blockDao.getTotalNumberByHourAsync(24);
        time = (86400 / num_blocks_past_24_hours) * (return_height - cur_height);
      }
      res.status(200).send({
        type: 'stake_return_time',
        body: { time }
      })
    } catch (e) {
      console.log(e)
      res.status(400).send('Error occurs:', e);
    }
  })

  router.get("/stake/:id", (req, res) => {
    console.log('Querying stake by address.');
    let { hasBalance = false, types = ['vcp', 'gcp'] } = req.query;
    const address = helper.normalize(req.params.id.toLowerCase());
    //TODO: Remove isChromeExt related after review
    const origin = req.headers.origin;
    const regex = /^chrome-extension:.*$/;
    const isChromeExt = origin && regex.test(origin);
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    stakeDao.getStakeByAddressAsync(address, types)
      .then(async stakeListInfo => {
        // TODO: Remove retry after fix the stake issue
        if (stakeListInfo.holderRecords.length === 0 && stakeListInfo.sourceRecords.length === 0) {
          stakeListInfo = await stakeDao.getStakeByAddressAsync(address, types);
        }
        if (hasBalance === 'true') {
          for (let i = 0; i < stakeListInfo.holderRecords.length; i++) {
            if (stakeListInfo.holderRecords[i].type === 'gcp') {
              const accInfo = await accountDao.getAccountByPkAsync(stakeListInfo.holderRecords[i].source);
              stakeListInfo.holderRecords[i].source_tfuelwei_balance = accInfo.balance.tfuelwei;
            }
          }
        }
        //TODO: Remove isChromeExt related after review
        if (isChromeExt) {
          const stakes = JSON.parse(JSON.stringify(stakeListInfo));
          stakeListInfo.stakes = stakes;
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