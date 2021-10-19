var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');


var tokenRouter = (app, tokenDao, tokenSumDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to get token info
  router.get("/tokenInfo/:address", (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    const { tokenId } = req.query;
    console.log('Querying the token info.');
    if (tokenId !== undefined) {
      tokenDao.getRecordsNumberByAddressAndTokenIdAsync(address, tokenId)
        .then(num => {
          const data = ({
            "type": "token_number",
            body: { "total_transfers": num },
          })
          res.status.send(data);
        })
    } else {
      tokenSumDao.getInfoByAddressAsync(address)
        .then(res => {
          const data = ({
            "type": "token_info",
            body: {
              "name": res.name,
              "holders": Object.keys(res.holders).length,
              "max_total_supply": res.max_total_supply,
              "total_transfers": res.total_transfers,
            }
          })
          res.status.send(data);
        })
    }
  });

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = tokenRouter;