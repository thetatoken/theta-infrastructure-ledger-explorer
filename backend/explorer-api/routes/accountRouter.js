var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var accountHelper = require('../../crawler/helper/account-helper');

var accountRouter = (app, accountDao, rpc) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/account/:address", async (req, res) => {
    let address = req.params.address.toUpperCase();
    console.log('Querying one account by using Id: ' + address);
    accountDao.getAccountByPkAsync(address)
      .then(accountInfo => {
        const data = ({
          type: 'account',
          body: accountInfo,
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
  router.get("/account/update/:address", async (req, res) => {
    let address = req.params.address.toUpperCase();
    console.log('Updating one account by Id:', address);
    rpc.getAccountAsync([{ 'address': address }])
      .then(async function (data) {
        let tmp = JSON.parse(data);
        if (tmp.result) {
          const isExist = await accountDao.checkAccountAsync(address);
          const accountInfo = isExist ? await accountDao.getAccountByPkAsync(address) : null;
          const txs_hash_list = accountInfo ? accountInfo.txs_hash_list : [];
          const newInfo = {
            address,
            'balance': tmp.result.coins,
            'sequence': tmp.result.sequence,
            'reserved_funds': tmp.result.reserved_funds,
            'txs_hash_list': txs_hash_list
          }
          await accountDao.upsertAccountAsync(newInfo);
          const data = ({
            type: 'account',
            body: newInfo,
          });
          res.status(200).send(data);
        } else {
          const err = ({
            type: 'error_not_found'
          });
          res.status(404).send(err);
        }
      })
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountRouter;