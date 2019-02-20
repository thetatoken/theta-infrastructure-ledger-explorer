var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var supplyRouter = (app) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to get total amount of Theta
  router.get("/supply/theta", (req, res) => {
    console.log('Querying the total amount of theta.');
    const data = ({
      "total_supply": 1000000000,
      "circulation_supply": 1000000000
    });
    res.status(200).send(data);
  });

  // The api to get total amount of TFuel
  router.get("/supply/tfuel", (req, res) => {
    console.log('Querying the total amount of theta.');
    const data = ({
      "circulation_supply": 5000000000
    });
    res.status(200).send(data);
  });

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = supplyRouter;