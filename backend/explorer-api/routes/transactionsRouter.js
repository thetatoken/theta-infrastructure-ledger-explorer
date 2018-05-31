var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var transactionRouter = (app, transactionDao, transactionProgressDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  router.get("/transactions/:sequence", (req, res) => {
    let pmt_sqnc = req.params.sequence;
    console.log('Querying one transaction by using Payment Sequence: ' + pmt_sqnc);
    transactionProgressDao.getProgressAsync(config.transaction.network_id)
      .then((progressInfo) => {
        latest_block_height = progressInfo.height;
        return transactionDao.getTransactionByPmtsqntAsync(Number(pmt_sqnc))
      })
      .then(transactionInfo => {
        var data = ({
          type: 'transaction',
          body: transactionInfo,
        });
        res.status(200).send(data);
      });
  });
  router.get("/transactions", (req, res) => {
    console.log('Querying all transactions');
    transactionProgressDao.getProgressAsync(config.transaction.network_id)
      .then((progressInfo) => {
        latest_block_height = progressInfo.height;
        return transactionDao.getAllTransactionsAsync()
      })
      .then(transactionInfo => {
        var data = ({
          type: 'transaction',
          body: transactionInfo,
        });
        res.status(200).send(data);
      });
  });

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = transactionRouter;