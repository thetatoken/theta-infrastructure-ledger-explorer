var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountingRouter = (app, accountingDao) => {
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/accounting", (req, res) => {
        let wallet = req.query.wallet;
        let startDate = (Date.parse(req.query.start) / 1000).toString();
        let endDate = (Date.parse(req.query.end) / 1000).toString();

        accountingDao.getAsync(wallet, startDate, endDate).then(data => {
            // const data = ({
            //   type: 'account',
            //   body: accountInfo,
            // });
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

module.exports = accountingRouter;