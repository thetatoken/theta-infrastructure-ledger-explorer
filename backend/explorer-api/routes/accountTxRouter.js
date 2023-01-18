var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');

function orderTxs(txs, ids) {
  var hashOfResults = txs.reduce(function (prev, curr) {
    prev[curr._id] = curr;
    return prev;
  }, {});

  return ids.map(function (id) { return hashOfResults[id] });
}

var accountTxRouter = (app, accountDao, accountTxDao, transactionDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  // @deprecated
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
  // @deprecated
  // router.get("/accountTx/tmp/:address", async (req, res) => {
  //   const address = helper.normalize(req.params.address.toLowerCase());
  //   let { type = 5, startTime = 0, endTime = 0 } = req.query;
  //   type = parseInt(type);
  //   accountTxDao.getInfoListByTimeAsync(address, startTime, endTime, type)
  //     .then(async infoList => {
  //       if (infoList && infoList.length < 2500) {
  //         let total = 0;
  //         for (let info of infoList) {
  //           const tmp = info._id.split('_');
  //           try {
  //             const tx = await transactionDao.getTransactionByPkAsync(tmp[1]);
  //             total += (tx.data.source.coins.tfuelwei - '0') / 1000000000000000000;
  //           } catch (e) {
  //             console.log('Error occurred while getting transaction in tmp:' + tmp[1]);
  //           }
  //         }
  //         var data = ({
  //           total: total
  //         });
  //         res.status(200).send(data);
  //       } else {
  //         const err = ({
  //           type: 'error_bad_request',
  //           error
  //         });
  //         res.status(400).send(err);
  //       }
  //     })
  // })

  router.get("/accountTx/history_v1/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    let { startDate, endDate } = req.query;
    const types = [0, 2, 5];
    const gap = 60 * 60 * 24 * 93;
    if (endDate - startDate > gap) {
      startDate = (endDate - gap).toString();
    }
    let startTime = +new Date();
    accountTxDao.getListByTimeAsync(address, startDate, endDate, types)
      .then(async txList => {
        console.log(`getListByTime takes ${(+new Date() - startTime) / 1000} seconds`);
        let txHashes = [];
        let txs = [];
        for (let acctTx of txList) {
          txHashes.push(acctTx.hash);
        }
        let maxLength = 1000;
        startTime = +new Date();
        console.log('txHashes length:', txHashes.length);
        for (let i = 0; i < Math.ceil(txHashes.length / maxLength); i++) {
          let end = Math.min(txHashes.length, (i + 1) * maxLength);
          let hashes = txHashes.slice(i * maxLength, end);
          console.log('hashes length:', hashes.length, i * maxLength, end);
          let tnxs = await transactionDao.getTxsByPkAndTimeAsync(hashes, startDate, endDate);
          console.log(`loop ${i + 1} takes ${(+new Date() - startTime) / 1000} seconds.`);
          startTime = +new Date();
          txs = txs.concat(tnxs)
        }
        console.log('txs length:', txs.length);

        // txs = await transactionDao.getTxsByPkWithSortAsync(txHashes);
        txs = orderTxs(txs, txHashes);
        console.log(`order records takes ${(+new Date() - startTime) / 1000} seconds`);
        startTime = +new Date();
        // var data = ({
        //   type: 'account_tx_list',
        //   body: txs
        // });
        // res.status(200).send(data);
        // return;
        let records = txs.map(tx => {
          const data = tx.data;
          let obj = {
            'tx_hash': tx.hash,
            'timestamp': `"${new Date(tx.timestamp * 1000).toUTCString()}"`
          }
          switch (tx.type) {
            case 0:
              if (data.proposer.address !== address) {
                data.outputs.forEach(output => {
                  if (output.address === address) {
                    obj.tx_type = 'Receive';
                    obj.theta_amount = helper.formatCoin(output.coins.thetawei);
                    obj.tfuel_amount = helper.formatCoin(output.coins.tfuelwei);
                    obj.from = '0x00000';
                    obj.to = address;
                  }
                })
              }
              break;
            case 2:
              if (data.inputs[0].address === address) {
                obj.tx_type = 'Send';
                obj.theta_amount = helper.formatCoin(data.inputs[0].coins.thetawei);
                obj.tfuel_amount = helper.formatCoin(data.inputs[0].coins.tfuelwei);
                obj.from = address;
                let to = data.outputs.reduce((sum, output) => sum + output.address + ' | ', '')
                obj.to = to.substring(0, to.length - 2)
              } else {
                data.outputs.forEach(output => {
                  if (output.address === address) {
                    obj.tx_type = 'Receive';
                    obj.theta_amount = helper.formatCoin(output.coins.thetawei);
                    obj.tfuel_amount = helper.formatCoin(output.coins.tfuelwei);
                    obj.from = data.inputs[0].address;
                    obj.to = address;
                  }
                })
              }
              break;
            case 5:
              if (data.source.address === address) {
                obj.tx_type = 'Send';
                obj.theta_amount = helper.formatCoin(data.source.coins.thetawei);
                obj.tfuel_amount = helper.formatCoin(data.source.coins.tfuelwei);
                obj.from = address;
                obj.to = data.target.address;
              } else if (data.target.address === address) {
                obj.tx_type = 'Receive';
                obj.theta_amount = helper.formatCoin(data.source.coins.thetawei);
                obj.tfuel_amount = helper.formatCoin(data.source.coins.tfuelwei);
                obj.from = data.source.address;
                obj.to = address;
              }
              break;
            default:
              break;
          }
          return obj;
        })
        console.log(`handle records takes ${(+new Date() - startTime) / 1000} seconds`);
        var data = ({
          type: 'account_tx_list',
          body: records
        });
        res.status(200).send(data);
      })
      .catch(error => {
        const err = ({
          type: 'error_not_found',
          error
        });
        res.status(404).send(err);
      });
  });

  router.get("/accountTx/history/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    const sTime = +new Date();
    let { startDate, endDate } = req.query;
    const types = [0, 2, 5];
    const gap = 60 * 60 * 24 * 93;
    if (endDate - startDate > gap) {
      startDate = (endDate - gap).toString();
    }
    const queryGap = 60 * 60 * 24 * 7;
    let records = [];
    try {
      for (let j = 0; j < Math.ceil((endDate - startDate) / queryGap); j++) {
        const sDate = Number(startDate) + j * queryGap;
        const eDate = Math.min(Number(startDate) + (j + 1) * queryGap, endDate);
        let startTime = +new Date();
        let st = startTime;
        let txList = await accountTxDao.getListByTimeAsync(address, sDate.toString(), eDate.toString(), types);
        console.log(`getListByTime takes ${(+new Date() - startTime) / 1000} seconds`);
        let txHashes = [];
        let txs = [];
        for (let acctTx of txList) {
          txHashes.push(acctTx.hash);
        }
        let maxLength = 1000;
        startTime = +new Date();
        console.log('txHashes length:', txHashes.length);
        for (let i = 0; i < Math.ceil(txHashes.length / maxLength); i++) {
          let end = Math.min(txHashes.length, (i + 1) * maxLength);
          let hashes = txHashes.slice(i * maxLength, end);
          console.log('hashes length:', hashes.length, i * maxLength, end);
          let tnxs = await transactionDao.getTxsByPkAndTimeAsync(hashes, sDate.toString(), eDate.toString());
          console.log(`loop ${i + 1} takes ${(+new Date() - startTime) / 1000} seconds.`);
          startTime = +new Date();
          txs = txs.concat(tnxs)
        }
        console.log('txs length:', txs.length);

        // txs = await transactionDao.getTxsByPkWithSortAsync(txHashes);
        txs = orderTxs(txs, txHashes);
        console.log(`order records takes ${(+new Date() - startTime) / 1000} seconds`);
        startTime = +new Date();
        let list = txs.map(tx => {
          const data = tx.data;
          let obj = {
            'tx_hash': tx.hash,
            'timestamp': `"${new Date(tx.timestamp * 1000).toUTCString()}"`
          }
          switch (tx.type) {
            case 0:
              if (data.proposer.address !== address) {
                data.outputs.forEach(output => {
                  if (output.address === address) {
                    obj.tx_type = 'Receive';
                    obj.theta_amount = helper.formatCoin(output.coins.thetawei);
                    obj.tfuel_amount = helper.formatCoin(output.coins.tfuelwei);
                    obj.from = '0x00000';
                    obj.to = address;
                  }
                })
              }
              break;
            case 2:
              if (data.inputs[0].address === address) {
                obj.tx_type = 'Send';
                obj.theta_amount = helper.formatCoin(data.inputs[0].coins.thetawei);
                obj.tfuel_amount = helper.formatCoin(data.inputs[0].coins.tfuelwei);
                obj.from = address;
                let to = data.outputs.reduce((sum, output) => sum + output.address + ' | ', '')
                obj.to = to.substring(0, to.length - 2)
              } else {
                data.outputs.forEach(output => {
                  if (output.address === address) {
                    obj.tx_type = 'Receive';
                    obj.theta_amount = helper.formatCoin(output.coins.thetawei);
                    obj.tfuel_amount = helper.formatCoin(output.coins.tfuelwei);
                    obj.from = data.inputs[0].address;
                    obj.to = address;
                  }
                })
              }
              break;
            case 5:
              if (data.source.address === address) {
                obj.tx_type = 'Send';
                obj.theta_amount = helper.formatCoin(data.source.coins.thetawei);
                obj.tfuel_amount = helper.formatCoin(data.source.coins.tfuelwei);
                obj.from = address;
                obj.to = data.target.address;
              } else if (data.target.address === address) {
                obj.tx_type = 'Receive';
                obj.theta_amount = helper.formatCoin(data.source.coins.thetawei);
                obj.tfuel_amount = helper.formatCoin(data.source.coins.tfuelwei);
                obj.from = data.source.address;
                obj.to = address;
              }
              break;
            default:
              break;
          }
          return obj;
        })
        console.log(`handle records takes ${(+new Date() - startTime) / 1000} seconds`);
        records = records.concat(list);
        console.log(`outer loop ${j} takes ${(+new Date() - st) / 1000} seconds`);

      }
      console.log(`Full process takes ${(+new Date() - sTime) / 1000} seconds`);

      var data = ({
        type: 'account_tx_list',
        body: records
      });
      res.status(200).send(data);
    } catch (err) {
      const e = ({
        type: 'error_not_found',
        error: err.message
      });
      res.status(404).send(e);
    }
  });

  router.get("/accountTx/:address", async (req, res) => {
    const address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    let { type = 2, isEqualType = 'true', pageNumber = 1, limitNumber = 10, types = null } = req.query;
    type = parseInt(type);
    if (types !== -1 && types !== null) {
      type = JSON.parse(types).map(c => parseInt(c))
    }
    pageNumber = parseInt(pageNumber);
    limitNumber = parseInt(limitNumber);
    let totalNumber = 0;
    let numPages = 0;
    let reverse = false;

    if (!isNaN(pageNumber) && !isNaN(limitNumber) && pageNumber > 0 && limitNumber > 0 && limitNumber < 101) {
      accountDao.getAccountByPkAsync(address)
        .then(accountInfo => {
          if (isEqualType === 'true') {
            totalNumber = Array.isArray(type) ? Object.keys(accountInfo.txs_counter)
              .reduce((total, key) => {
                key = parseInt(key)
                return type.indexOf(key) < 0 ? total : total + accountInfo.txs_counter[key]
              }, 0) : accountInfo.txs_counter[type] || 0;
          } else {
            if (accountInfo.txs_counter) {
              totalNumber = Object.keys(accountInfo.txs_counter).reduce((total, key) => {
                return key == type ? total : total + accountInfo.txs_counter[key]
              }, 0);
            }
          }
          numPages = Math.ceil(totalNumber / limitNumber);
          let page = pageNumber - 1;
          if (numPages > 200 && pageNumber > numPages / 2) {
            reverse = true;
            page = numPages - pageNumber;
          }

          return accountTxDao.getListAsync(address, type, isEqualType, page, limitNumber, reverse);
        })
        .then(async txList => {
          let txHashes = [];
          let txs = [];
          for (let acctTx of txList) {
            if (reverse) {
              txHashes.unshift(acctTx.hash);
            } else {
              txHashes.push(acctTx.hash);
            }
          }

          txs = await transactionDao.getTransactionsByPkAsync(txHashes);
          txs = orderTxs(txs, txHashes);

          var data = ({
            type: 'account_tx_list',
            body: txs,
            totalPageNumber: numPages,
            currentPageNumber: pageNumber
          });
          res.status(200).send(data);
        })
        .catch(error => {
          if (error.message.includes('NOT_FOUND')) {
            accountTxDao.getListAsync(address, type, isEqualType, pageNumber - 1, limitNumber, reverse)
              .then(async txList => {
                let txHashes = [];
                let txs = [];
                for (let acctTx of txList) {
                  if (reverse) {
                    txHashes.unshift(acctTx.hash);
                  } else {
                    txHashes.push(acctTx.hash);
                  }
                }

                txs = await transactionDao.getTransactionsByPkAsync(txHashes);
                txs = orderTxs(txs, txHashes);
                if (txs.length > 0) {
                  var data = ({
                    type: 'account_tx_list',
                    body: txs,
                    totalPageNumber: numPages,
                    currentPageNumber: pageNumber
                  });
                  res.status(200).send(data);
                } else {
                  const err = ({
                    type: 'error_not_found',
                  });
                  res.status(404).send(err);
                }
              }).catch(error => {
                const err = ({
                  type: 'error_not_found',
                  error
                });
                res.status(404).send(err);
              })
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
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    let { startTime = 0 } = req.query;
    const endTime = Math.ceil(Date.now() / 1000).toString();
    const gap = 60 * 60 * 24 * 14;
    if (endTime - startTime > gap) {
      startTime = (endTime - gap).toString();
    }
    accountTxDao.getListByTimeAsync(address, startTime, endTime, null)
      .then(async txList => {
        let txHashes = [];
        let txs = [];
        for (let acctTx of txList) {
          txHashes.push(acctTx.hash);
        }

        txs = await transactionDao.getTransactionsByPkAsync(txHashes);
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

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountTxRouter;