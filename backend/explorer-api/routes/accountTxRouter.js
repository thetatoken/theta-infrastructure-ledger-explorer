var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountTxRouter = (app, accountTxDao, rpc) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/accountTx/:address", async (req, res) => {
    const address = req.params.address.toUpperCase();
    let { type, isEqualType, pageNumber, limitNumber } = req.query;
    type = parseInt(type);
    pageNumber = parseInt(pageNumber);
    limitNumber = parseInt(limitNumber);
    if (!isNaN(type) && !isNaN(pageNumber) && !isNaN(limitNumber) && pageNumber > -1 && limitNumber > 0 && limitNumber < 101) {
      accountTxDao.getInfoListByTypeAsync(address, type, isEqualType, pageNumber, limitNumber)
        .then(infoList => {
          infoList.forEach(info => {
            const tmp = info._id.split('_');
            info.account_address = tmp[0];
            info.tx_hash = tmp[1];
          })
          var data = ({
            type: 'account_tx_list',
            body: infoList,
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