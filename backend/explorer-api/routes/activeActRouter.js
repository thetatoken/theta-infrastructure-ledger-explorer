var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var activeActRouter = (app, activeActDao, rpc) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  router.get("/activeAccount/latest", async (req, res) => {
    activeActDao.getLatestRecordsAsync(1)
      .then(infoList => {
        let body;
        if (Array.isArray(infoList) && infoList.length > 0) {
          body = infoList[0];
        }
        const data = ({
          type: 'active_account',
          body
        });
        res.status(200).send(data);
      })
      .catch(error => {
        console.log('ERR - ', error.message)
        res.status(400).send(error.message);
      });
  });

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = activeActRouter;