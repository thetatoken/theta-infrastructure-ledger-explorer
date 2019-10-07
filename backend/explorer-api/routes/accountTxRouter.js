var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');

function orderTxs(txs, ids) {
  var hashOfResults = txs.reduce(function (prev, curr) {
      prev[curr._id] = curr;
      return prev;
  }, {});

  return ids.map( function(id) { return hashOfResults[id] } );
}

var accountTxRouter = (app, accountDao, accountTxDao, accountTxSendDao, transactionDao, rpc) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  // router.get("/accountTx/counter/:address", async (req, res) => {
  //   const address = helper.normalize(req.params.address.toLowerCase());
  //   let { type = 5, isEqualType = 'true', startTime = 0, endTime = 0 } = req.query;
  //   type = parseInt(type);
  //   accountTxDao.getInfoTotalAsync(address, type, isEqualType, startTime, endTime)
  //     .then(resp => {
  //       const data = ({
  //         total: resp
  //       });
  //       res.status(200).send(data);
  //     })
  // })

  router.get("/accountTx/tmp/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    let { type = 5, startTime = 0, endTime = 0 } = req.query;
    type = parseInt(type);
    accountTxDao.getInfoListByTimeAsync(address, startTime, endTime, type)
      .then(async infoList => {
        if (infoList && infoList.length < 2500) {
          let total = 0;
          for (let info of infoList) {
            const tmp = info._id.split('_');
            try {
              const tx = await transactionDao.getTransactionByPkAsync(tmp[1]);
              total += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
            } catch (e) {
              console.log('Error occurred while getting transaction in tmp:' + tmp[1]);
            }
          }
          var data = ({
            total: total
          });
          res.status(200).send(data);
        } else {
          const err = ({
            type: 'error_bad_request',
            error
          });
          res.status(400).send(err);
        }
      })
  })

  router.get("/accountTx/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    let { type = 2, isEqualType = 'true', pageNumber = 1, limitNumber = 10 } = req.query;
    type = parseInt(type);
    pageNumber = parseInt(pageNumber);
    limitNumber = parseInt(limitNumber);
    let totalNumber = 0;

    if (!isNaN(pageNumber) && !isNaN(limitNumber) && pageNumber > 0 && limitNumber > 0 && limitNumber < 101) {
      accountDao.getAccountByPkAsync(address)
        .then(accountInfo => {
          if (isEqualType === 'true') {
            totalNumber = accountInfo.txs_counter[type] ? accountInfo.txs_counter[type] : 0;
          } else {
            if (accountInfo.txs_counter) {
              totalNumber = Object.keys(accountInfo.txs_counter).reduce((total, key) => {
                return key === type ? total : total + accountInfo.txs_counter[key]
              }, 0);
            }
          }

          return accountTxDao.getListAsync(address, type, isEqualType, pageNumber - 1, limitNumber);
        })
        .then(txList => {
            let txHashes = [];
            let txs = [];
            for (let acctTx of txList) {
              txHashes.push(acctTx.hash);
            }
            
            txs = transactionDao.getTransactionsByPkAsync(txHashes);
            txs = orderTxs(txs, txHashes);

            var data = ({
              type: 'account_tx_list',
              body: txs,
              totalPageNumber: Math.ceil(totalNumber / limitNumber),
              currentPageNumber: pageNumber
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
            res.status(500).send(err);
          }
        });
    } else {
      res.status(400).send('Invalid parameter');
    }
  });

  router.get("/accountTx/latest/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    let { startTime = 0 } = req.query;
    const endTime = Math.ceil(Date.now() / 1000).toString();
    accountTxDao.getListByTimeAsync(address, startTime, endTime, null)
      .then(infoList => {
          let txHashes = [];
          let txs = [];
          for (let acctTx of txList) {
            txHashes.push(acctTx.hash);
          }

          txs = transactionDao.getTransactionsByPkAsync(txHashes);
          txs = orderTxs(txs, txHashes);

          var data = ({
            type: 'account_tx_list',
            body: txs,
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
          res.status(500).send(err);
        }
      });
  });


  router.get("/accountTxOld/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    let { type = 2, isEqualType = 'true', pageNumber = 1, limitNumber = 10 } = req.query;
    let totalNumber = 0;
    let diff = null;
    pageNumber = parseInt(pageNumber);
    limitNumber = parseInt(limitNumber);
    if (!isNaN(pageNumber) && !isNaN(limitNumber) && pageNumber > 0 && limitNumber > 0 && limitNumber < 101) {
      accountDao.getAccountByPkAsync(address)
        .then(accountInfo => {
          if (isEqualType === 'true') {
            totalNumber = accountInfo.txs_counter[type] ? accountInfo.txs_counter[type] : 0;
          } else {
            if (accountInfo.txs_counter) {
              totalNumber = Object.keys(accountInfo.txs_counter).reduce((total, key) => {
                return key === type ? total : total + accountInfo.txs_counter[key]
              }, 0);
            }
          }
          type = parseInt(type);
          if (totalNumber < pageNumber * limitNumber) {
            if (totalNumber > (pageNumber - 1) * limitNumber) {
              diff = totalNumber - (pageNumber - 1) * limitNumber;
              if ((isEqualType === 'true' && type === 2) || totalNumber === accountInfo.txs_counter[2]) {
                console.log('Search Tx Send DB only!');
                return accountTxSendDao.getInfoListAsync(address, pageNumber - 1, limitNumber, diff);
              } else {
                return accountTxDao.getInfoListByTypeAsync(address, type, isEqualType, pageNumber - 1, limitNumber, diff)
              }
            } else {
              const data = ({
                type: 'account_tx_list',
                body: [],
                totalPageNumber: Math.ceil(totalNumber / limitNumber),
                currentPageNumber: pageNumber
              });
              res.status(200).send(data);
            }
          } else {
            if ((isEqualType === 'true' && type === 2) || totalNumber === accountInfo.txs_counter[2]) {
              console.log('Search Tx Send DB only!');
              return accountTxSendDao.getInfoListAsync(address, pageNumber - 1, limitNumber, diff);
            } else {
              return accountTxDao.getInfoListByTypeAsync(address, type, isEqualType, pageNumber - 1, limitNumber, diff)
            }
          }
        })
        .then(async infoList => {
          if (infoList) {
            let result = [];
            for (let info of infoList) {
              const tmp = info._id.split('_');
              try {
                const tx = await transactionDao.getTransactionByPkAsync(tmp[1]);
                result.push(tx);
              } catch (e) {
                console.log('Error occurred while getting transaction:' + tmp[1]);
              }
            }
            // result = diff === null ? result : result.reverse();
            var data = ({
              type: 'account_tx_list',
              body: result,
              totalPageNumber: Math.ceil(totalNumber / limitNumber),
              currentPageNumber: pageNumber
            });
            res.status(200).send(data);
          }
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
    } else {
      res.status(400).send('Wrong parameter.');
    }
  });

  router.get("/accountTxOld/latest/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    let { startTime = 0 } = req.query;
    const endTime = Math.ceil(Date.now() / 1000).toString();
    accountTxDao.getInfoListByTimeAsync(address, startTime, endTime, null)
      .then(async infoList => {
        if (infoList) {
          let result = [];
          for (let info of infoList) {
            const tmp = info._id.split('_');
            try {
              const tx = await transactionDao.getTransactionByPkAsync(tmp[1]);
              result.push(tx);
            } catch (e) {
              console.log('Error occurred while getting transaction:' + tmp[1]);
            }
          }
          var data = ({
            type: 'account_tx_list',
            body: result,
          });
          res.status(200).send(data);
        } else {
          const err = ({
            type: 'error_bad_request',
            error
          });
          res.status(400).send(err);
        }
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

module.exports = accountTxRouter;