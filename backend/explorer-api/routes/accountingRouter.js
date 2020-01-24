var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var accountingRouter = (app, accountingDao) => {
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/accounting", (req, res) => {
        console.log("===> wallet: " + req.query.wallet)
        let wallet = req.query.wallet;
        let startDate = (Date.parse(req.query.start) / 1000).toString();
        let endDate = (Date.parse(req.query.end) / 1000).toString();

        (async ()=>{
            let data = await accountingDao.getAsync(wallet, startDate, endDate);
            res.status(200).send(data);
        })();
    });

    //the / route of router will get mapped to /api
    app.use('/api', router);
}

module.exports = accountingRouter;