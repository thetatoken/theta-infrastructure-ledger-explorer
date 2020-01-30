var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountingRouter = (app, accountingDao) => {
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/accounting", (req, res) => {
        let wallet = req.query.wallet;
        let startTime = Date.parse(req.query.start) / 1000;
        let endTime = Date.parse(req.query.end);
        let endDate = new Date(endTime);
        endDate.setDate(endDate.getDate() + 1);
        endTime = endDate.getTime() / 1000;

        accountingDao.getAsync(wallet, startTime, endTime).then(data => {
            data.forEach(function(info) {
                let date = new Date(info.date);
                let month = date.getUTCMonth() + 1;
                let day = date.getUTCDate();
                let year = date.getUTCFullYear();
                info.date = year + "-" + month + "-" + day;
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

module.exports = accountingRouter;