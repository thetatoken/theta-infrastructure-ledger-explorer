var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');

var accountingRouter = (app, rewardDistributionDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/rewardDistribution/all", async (req, res) => {
    rewardDistributionDao.getAllRewardDistributionAsync()
      .then(list => {
        res.status(200).send({
          type: 'stake_reward_distribution_list',
          body: list
        })
      }).catch(err => {
        console.log('err:', err)
        res.status(400).send(new Error(err))
      })
  })

  router.get("/rewardDistribution/:address", async (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    rewardDistributionDao.getRewardDistributionByAddressAsync(address)
      .then(list => {
        if (list && list.length === 0) {
          res.status(404).send({
            type: 'stake_reward_distribution',
            error: `Split reward distribution not found for address ${address}`
          })
          return;
        }
        res.status(200).send({
          type: 'stake_reward_distribution',
          body: list[0]
        })
      }).catch(err => {
        console.log('err:', err)
        res.status(400).send(new Error(err))
      })
  })

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountingRouter;