var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountRouter = (app, accountDao, transactionDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  
  router.get("/account/:address", (req, res) => {
    let address = req.params.address;
    let verbose = req.query.verbose && req.query.verbose == 'true';
    accountDao.getAccountByPkAsync(address)
      .then(accountInfo => {
        const data = ({
          type: 'account',
          body: accountInfo,
        });
        if (verbose && accountInfo.txs_hash_list.length) {
          transactionDao.getTransactionsByPkArr(accountInfo.txs_hash_list, (error, transactions) => {
            data.body.txs_verbose = transactions;
            res.status(200).send(data);
          })
        } else {
          res.status(200).send(data);
        }
      })
      .catch(error => {
        switch (error.code) {
          // Code 2 means AS_PROTO_RESULT_FAIL_NOTFOUND
          // No record is found with the specified namespace/set/key combination.
          case 2:
            const err = ({
              type: 'error_not_found',
              error
            });
            res.status(200).send(err);
            break
          default:
            console.log('ERR - ', error)
        }
      });
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountRouter;