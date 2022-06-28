var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var axios = require("axios").default;
var { updateTokenHistoryBySmartContract } = require('../helper/smart-contract');

var smartContractRouter = (app, smartContractDao, transactionDao, accountTxDao, tokenDao, tokenSummaryDao, tokenHolderDao) => {
  router.use(bodyParser.json({ limit: '1mb' }));
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to verify the source and bytecode
  router.post("/smartContract/verify/:address", async (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    let { sourceCode, abi, version, optimizer, versionFullName, optimizerRuns = 200 } = req.body;
    optimizerRuns = +optimizerRuns;
    if (Number.isNaN(optimizerRuns)) optimizerRuns = 200;
    console.log('Verifying source code for address', address);
    try {
      let sc = await smartContractDao.getSmartContractByAddressAsync(address)
      let byteCode = sc.bytecode;
      let result = await axios.post(`http://localhost:9090/api/verify/${address}`, {
        byteCode, sourceCode, abi, version, optimizer, versionFullName, optimizerRuns
      })
      console.log('Received response from verification server.', result.data.result);
      if (result.data.result.verified === true) {
        let newSc = { ...result.data.smart_contract, bytecode: byteCode }
        await smartContractDao.upsertSmartContractAsync(newSc);
        updateTokenHistoryBySmartContract(newSc, transactionDao, accountTxDao, tokenDao, tokenSummaryDao, tokenHolderDao);
      }
      const data = {
        result: result.data.result,
        err_msg: result.data.err_msg,
        warning_msg: result.data.warning_msg
      }
      res.status(200).send(data)
    } catch (e) {
      if (e.response) {
        console.log('Error in catch:', e.response.status)
        res.status(400).send(e.response.status)
      } else {
        res.status(400).send(e)
      }
    }
  });
  // The api to only get smart contract api by address
  router.get("/smartContract/abi/:address", (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    console.log('Querying smart contract abi for address:', address);
    smartContractDao.getAbiAsync(address)
      .then(info => {
        const data = ({
          type: 'smart_contract_abi',
          body: info[0],
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

  // The api to smart contract info by address
  router.get("/smartContract/:address", (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    console.log('Querying smart contract data for address:', address);
    smartContractDao.getSmartContractByAddressAsync(address)
      .then(info => {
        const data = ({
          type: 'smart_contract',
          body: info,
        });
        res.status(200).send(data);
      })
      .catch(error => {
        if (error.message.includes('NOT_FOUND')) {
          // rpc.getCodeAsync([{ 'address': address, 'height': 0 }])
          //   .then(async function (data) {
          //     console.log('data:', data);
          //   }).catch(err => {
          //     console.log('err msg:', err.message);
          //   })
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

module.exports = smartContractRouter;