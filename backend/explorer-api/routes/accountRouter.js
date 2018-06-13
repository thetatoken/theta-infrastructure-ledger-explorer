var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountRouter = (app, accountDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  
  router.get("/account/:address", (req, res) => {
    let address = req.params.address;
    accountDao.getAccountByPkAsync(address)
      .then(accountInfo => {
        const data = ({
          type: 'account',
          body: accountInfo,
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
            res.status(200).send(err);
            break
          default:
            console.log('ERR - ', err)
        }
      });
  });
  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = accountRouter;