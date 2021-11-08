var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');

var startTime = 0;
var txNumber = 0;
var cachePeriod = 10 * 60 * 1000; // 10 mins

var transactionRouter = (app, transactionDao, progressDao, txHistoryDao, config) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/transaction/:hash", (req, res) => {
    let hash = helper.normalize(req.params.hash.toLowerCase());
    console.log('Querying one transaction by using uuid: ' + hash);
    if (!helper.validateHex(hash, 64)) {
      res.status(400).send({ type: 'invalid_hash' })
      return;
    }
    progressDao.getProgressAsync(config.blockchain.networkId)
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

  router.get("/transactions/range", (req, res) => {
    let totalPageNumber = 0;
    let { pageNumber = 1, limit = 10 } = req.query;
    progressDao.getProgressAsync(config.blockchain.networkId)
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
          return;
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

  router.get("/transactions/number", (req, res) => {
    var curTime = +new Date();
    if (curTime - startTime > cachePeriod) {
      transactionDao.getTotalNumberByHourAsync(null)
        .then(number => {
          txNumber = number;
          startTime = curTime;
          var data = ({
            type: 'transaction_number',
            body: { total_num_tx: number }
          });
          res.status(200).send(data);
        })
        .catch(err => {
          console.log('Error - Push total number of transaction', err);
        });
    } else {
      res.status(200).send({
        type: 'transaction_number',
        body: { total_num_tx: txNumber }
      });
    }

  });

  router.get("/transactions/number/:h", (req, res) => {
    const { h } = req.params;
    const hour = Number.parseInt(h);
    if (hour > 720) {
      res.status(400).send('Wrong parameter.');
      return;
    }
    transactionDao.getTotalNumberByHourAsync(hour)
      .then(number => {
        var data = ({
          type: 'transaction_number_by_hour',
          body: { total_num_tx: number }
        });
        res.status(200).send(data);
      })
      .catch(err => {
        console.log('Error - Push total number of transaction', err);
      });
  });

  router.get("/transactions/history", (req, res) => {
    txHistoryDao.getAllTxHistoryAsync()
      .then(infoList => {
        var data = ({
          type: 'transaction_number_by_hour',
          body: { data: infoList }
        });
        res.status(200).send(data);
      })
      .catch(err => {
        console.log('Error - Push total number of transaction', err);
      });
  })
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = transactionRouter;