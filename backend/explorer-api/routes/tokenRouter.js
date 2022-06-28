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
      return;
    } else {
      tokenSumDao.getInfoByAddressAsync(address)
        .then(result => {
          if (result === null) {
            res.status(404).send({
              type: 'error_not_found',
            });
            return;
          }
          const data = ({
            "type": "token_info",
            body: {
              "name": result.name,
              "holders": result.holders.total,
              "max_total_supply": result.max_total_supply,
              "total_transfers": result.total_transfers,
              "type": result.type,
              "decimals": result.decimals,
              "contract_address": result._id,
              "symbol": result.symbol
            }
          })
          res.status(200).send(data);
        })
    }
  });

  // The api to get token summaries by address list
  router.get("/tokenSummaries", (req, res) => {
    console.log('Querying the token summaries.');
    const { addressList } = req.query;
    let list = [];
    try {
      list = JSON.parse(addressList);
    } catch (e) {
      res.status(400).send('Wrong parameter.');
      return;
    }
    if (!Array.isArray(list)) {
      res.status(400).send('Wrong parameter.');
      return;
    }
    list = list
      .filter(address => helper.validateHex(address, 40))
      .map(address => address.toLowerCase())
    tokenSumDao.getRecordsAsync({ _id: { $in: list } })
      .then(result => {
        if (result.length === 0) {
          res.status(404).send({
            type: 'error_not_found',
          });
          return;
        }
        const data = ({
          "type": "token_info",
          body: result.map(r => ({
            "name": r.name,
            "holders": r.holders.total,
            "max_total_supply": r.max_total_supply,
            "total_transfers": r.total_transfers,
            "type": r.type,
            "decimals": r.decimals,
            "contract_address": r._id
          }))
        })
        res.status(200).send(data);
      })
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
        if (!info) return;
        const data = ({
          type: "token_info",
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
    tokenHolderDao.getHolderListAsync(address, tokenId)
      .then(result => {
        if (result === null) {
          res.status(404).send({
            type: 'error_not_found',
          });
          return;
        }
        let holders = [];
        if (tokenId == null) {
          const map = {};
          result.forEach(info => {
            const address = info.holder;
            if (map[address] === undefined) map[address] = 0;
            map[address] = BigNumber.sum(new BigNumber(map[address]), new BigNumber(info.amount)).toFixed();
          })
          holders = Object.keys(map).map(address => ({
            address: address,
            amount: map[address]
          }))
        } else {
          holders = result.map(info => {
            return { address: info.holder, amount: info.amount }
          });
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

  // router.get("/token/topholders", (req, res) => {
  //   let { limit = 10 } = req.query;
  //   if (limit > 100) limit = 100;
  //   const tdropAddress = "0x08a0c0e8efd07a98db11d79165063b6bc2469adf"; // testnet
  //   // const tdropAddress = "0x1336739b05c7ab8a526d40dcc0d04a826b5f8b03"; // mainnet
  //   tokenHolderDao.getTopHoldersAsync(tdropAddress, null, limit)
  //     .then(result => {
  //       if (result === null) {
  //         res.status(404).send({
  //           type: 'error_not_found',
  //         });
  //         return;
  //       }
  //       let holders = [];
  //       if (tokenId == null) {
  //         const map = {};
  //         result.forEach(info => {
  //           const address = info.holder;
  //           if (map[address] === undefined) map[address] = 0;
  //           map[address] = BigNumber.sum(new BigNumber(map[address]), new BigNumber(info.amount)).toFixed();
  //         })
  //         holders = Object.keys(map).map(address => ({
  //           address: address,
  //           amount: map[address]
  //         }))
  //       } else {
  //         holders = result.map(info => {
  //           return { address: info.holder, amount: info.amount }
  //         });
  //       }
  //       const data = ({
  //         "type": "token_holders",
  //         body: {
  //           "holders": holders
  //         }
  //       })
  //       res.status(200).send(data);
  //     })
  // })

  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = tokenRouter;