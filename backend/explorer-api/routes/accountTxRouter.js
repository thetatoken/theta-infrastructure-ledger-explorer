var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountTxRouter = (app, accountTxDao, transactionDao, rpc) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/accountTx/:address", async (req, res) => {
    const address = req.params.address.toLowerCase();
    let { type = 5, isEqualType = 'false', pageNumber = 0, limitNumber = 10 } = req.query;
    let totalNumber = 0;
    type = parseInt(type);
    pageNumber = parseInt(pageNumber);
    limitNumber = parseInt(limitNumber);
    console.log(`typoe: ${type}, page: ${pageNumber}, limit: ${limitNumber}`)
    if (!isNaN(pageNumber) && !isNaN(limitNumber) && pageNumber > -1 && limitNumber > 0 && limitNumber < 101) {
      accountTxDao.getInfoTotalAsync(address, type, isEqualType)
        .then(number => {
          totalNumber = number;
          return accountTxDao.getInfoListByTypeAsync(address, type, isEqualType, pageNumber, limitNumber)
        })
        .then(async infoList => {
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
            console.log('ERR - ', error)
          }
        });
    } else {
      res.status(400).send('Wrong parameter.');
    }
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountTxRouter;