var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var transactionRouter = (app, transactionDao, transactionProgressDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/transaction/:uuid", (req, res) => {
    let uuid = req.params.uuid;
    console.log('Querying one transaction by using uuid: ' + uuid);
    transactionProgressDao.getProgressAsync(config.transaction.network_id)
      .then((progressInfo) => {
        latest_transaction_count = progressInfo.count;
        return transactionDao.getTransactionByUuidAsync(Number(uuid))
      })
      .then(transactionInfo => {
        var data = ({
          type: 'transaction',
          body: transactionInfo,
          totalTxsNumber: latest_transaction_count
        });
        res.status(200).send(data);
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
            // var blockInfo = {};
            // blockInfo.error = 'Not Found';
            res.status(200).send(err);
            break
          default:
            console.log('ERR - ', err)
        }
      });;
  });

  router.get("/transactions", (req, res) => {
    transactionProgressDao.getProgressAsync(config.transaction.network_id)
      .then((progressInfo) => {
        latest_transaction_count = progressInfo.count;
        return transactionDao.getTransactionsAsync(1, latest_transaction_count)
      })
      .then(transactionInfoList => {
        var data = ({
          type: 'transaction_list',
          body: transactionInfoList,
        });
        res.status(200).send(data);
      });
  });

  router.get("/transactions/range", (req, res) => {
    numberOfTransactions = 10;
    let totalPageNumber, pageNumber = 1;
    transactionProgressDao.getProgressAsync(config.transaction.network_id)
      .then((progressInfo) => {
        latest_transaction_count = progressInfo.count;
        console.log('Latest transaction count: ' + latest_transaction_count.toString());
        var query_txs_count_max = latest_transaction_count;
        var query_txs_count_min = Math.max(0, query_txs_count_max - numberOfTransactions + 1); // pushing 100 blocks initially
        totalPageNumber = Math.floor(latest_transaction_count / req.query.limit + 1);
        if (req.query.pageNumber !== undefined && req.query.limit !== undefined) {
          const { limit } = req.query;
          pageNumber = req.query.pageNumber;
          query_txs_count_max = latest_transaction_count - pageNumber * limit;
          query_txs_count_min = Math.max(1, query_txs_count_max - limit + 1);
        }
        console.log('REST api querying transactions from ' + query_txs_count_min.toString() + ' to ' + query_txs_count_max.toString())
        //return blockDao.getBlockAsync(123) 
        return transactionDao.getTransactionsAsync(query_txs_count_min, query_txs_count_max)
      })
      .then(transactionInfoList => {
        var data = ({
          type: 'transaction_list',
          body: transactionInfoList,
          totalPageNumber,
          currentPageNumber: pageNumber
        });
        res.status(200).send(data);
      });
  })
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = transactionRouter;