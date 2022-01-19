var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var BigNumber = require('bignumber.js');


var tokenRouter = (app, tokenDao, tokenSumDao, tokenHolderDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to get token summary
  router.get("/tokenSummary/:address", (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    const { tokenId } = req.query;
    console.log('Querying the token summary.');
    if (tokenId !== undefined) {
      tokenDao.getRecordsNumberByAddressAndTokenIdAsync(address, tokenId)
        .then(async num => {
          const data = ({
            "type": "token_number",
            body: { "total_transfers": num },
          })
          res.status(200).send(data);
        })
    } else {
      tokenSumDao.getInfoByAddressAsync(address)
        .then(result => {
          if (result === null) {
            res.status(404).send({
              type: 'error_not_found',
            });
            return;
          }
          let accountSet = new Set();
          Object.keys(result.holders).forEach(key => {
            Object.keys(result.holders[key]).forEach(address => {
              accountSet.add(address);
            })
          })
          const data = ({
            "type": "token_info",
            body: {
              "name": result.name,
              "holders": accountSet.size,
              "max_total_supply": result.max_total_supply,
              "total_transfers": result.total_transfers,
              "type": result.type
            }
          })
          res.status(200).send(data);
        })
    }
  });

  // The api to get token info
  router.get("/token/:address", (req, res) => {
    console.log('Querying the token info.');
    let address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    let totalPageNumber = 0;
    let { tokenId, pageNumber = 1, limit = 10 } = req.query;
    tokenDao.getRecordsNumberByAddressAndTokenIdAsync(address, tokenId)
      .then(totalNumber => {
        pageNumber = parseInt(pageNumber);
        limit = parseInt(limit);
        totalPageNumber = Math.ceil(totalNumber / limit);
        if (!isNaN(pageNumber) && !isNaN(limit) && pageNumber > 0 && pageNumber <= totalPageNumber && limit > 0 && limit < 101) {
          return tokenDao.getInfoListByAddressAndTokenIdAsync(address, tokenId, pageNumber - 1, limit)
        } else {
          res.status(400).send('Wrong parameter.');
          return;
        }
      })
      .then(info => {
        const data = ({
          "type": "token_info",
          body: info,
          totalPageNumber,
          currentPageNumber: pageNumber
        })
        res.status(200).send(data);
      })
  });

  // The API to get token holders
  router.get("/tokenHolder/:address", (req, res) => {
    console.log('Querying the token holders.');
    let address = helper.normalize(req.params.address.toLowerCase());
    if (!helper.validateHex(address, 40)) {
      res.status(400).send({ type: 'invalid_address' })
      return;
    }
    let { tokenId } = req.query;
    tokenSumDao.getInfoByAddressAsync(address)
      .then(result => {
        if (result === null) {
          res.status(404).send({
            type: 'error_not_found',
          });
          return;
        }
        let holders = [];
        if (tokenId == null) {
          const obj = result.holders;
          let map = {};
          Object.keys(obj).forEach(key => {
            Object.keys(obj[key]).forEach(account => {
              if (map[account] === undefined) map[account] = 0;
              map[account] = BigNumber.sum(new BigNumber(map[account]), new BigNumber(obj[key][account])).toFixed();
            })
          })
          holders = Object.keys(map).map(key => ({
            key: key,
            value: map[key]
          }))
        } else {
          const key = address + tokenId;
          let obj = result.holders[key];
          holders = Object.keys(obj).map(key => ({
            key: key,
            value: obj[key]
          }))
        }
        const data = ({
          "type": "token_holders",
          body: {
            "holders": holders
          }
        })
        res.status(200).send(data);
      })
  })

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = tokenRouter;