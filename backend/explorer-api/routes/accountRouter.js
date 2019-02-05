var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountRouter = (app, accountDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  
  router.get("/account/:address", (req, res) => {
    let address = req.params.address;
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
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountRouter;