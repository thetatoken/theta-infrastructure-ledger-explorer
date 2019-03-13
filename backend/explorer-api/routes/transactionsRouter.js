var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');

var transactionRouter = (app, transactionDao, progressDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/transaction/:hash", (req, res) => {
    let hash = helper.normalize(req.params.hash.toLowerCase());
    console.log('Querying one transaction by using uuid: ' + hash);
    progressDao.getProgressAsync(config.blockchain.network_id)
      .then((progressInfo) => {
        latest_transaction_count = progressInfo.count;
        return transactionDao.getTransactionByPkAsync(hash)
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
        if (error.message.includes('NOT_FOUND')) {
          const err = ({
            type: 'error_not_found',
            error
          });
          res.status(404).send(err);
        } else {
          console.log('ERR - ', error)
        }
      });;
  });

  router.get("/transactions", (req, res) => {
    progressDao.getProgressAsync(config.blockchain.network_id)
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
    let totalPageNumber = 0;
    let { pageNumber = 1, limit = 10 } = req.query;
    progressDao.getProgressAsync(config.blockchain.network_id)
      .then((progressInfo) => {
        totalNumber = progressInfo.count;
        let diff = null;
        pageNumber = parseInt(pageNumber);
        limit = parseInt(limit);
        totalPageNumber = Math.ceil(totalNumber / limit);
        let searchPage = pageNumber;
        if (!isNaN(pageNumber) && !isNaN(limit) && pageNumber > 0 && pageNumber <= totalPageNumber && limit > 0 && limit < 101) {
          if (pageNumber > totalPageNumber / 2) {
            diff = limit;
            searchPage = totalPageNumber - pageNumber + 1;
          }
          return transactionDao.getTransactionsAsync(searchPage - 1, limit, diff)
        } else {
          res.status(400).send('Wrong parameter.');
        }
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