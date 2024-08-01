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
    let { sourceCode, abi, version, optimizer, versionFullName, optimizerRuns = 200, isSingleFile = true,
      libs = {}, evm = 'default', viaIR = false } = req.body;
    console.log('isSingleFile:', isSingleFile, typeof isSingleFile)
    console.log('viaIR:', viaIR, typeof viaIR)
    optimizerRuns = +optimizerRuns;
    if (Number.isNaN(optimizerRuns)) optimizerRuns = 200;
    console.log('Verifying source code for address', address);
    try {
      let sc = await smartContractDao.getSmartContractByAddressAsync(address)
      let byteCode = sc.bytecode;
      let libsSourceCode = {}
      for (let lib in libs) {
        const libAdr = helper.normalize(libs[lib].toLowerCase());
        console.log('lib:', lib, libAdr)

        if (!helper.validateHex(libAdr, 40)) {
          res.status(200).send({ err_msg: `Invalid library address: ${libAdr}.` })
          return;
        }
        let libsc;
        try {
          libsc = await smartContractDao.getSmartContractByAddressAsync(libAdr);
        } catch (e) {
          if (e.message.includes('NOT_FOUND')) {
            res.status(200).send({ err_msg: `No contract library found on address: ${libAdr}.` })
            return;
          }
        }
        if (!libsc.source_code) {
          res.status(200).send({ err_msg: `Library contract ${libAdr}} haven't been verified, please verify the library contract first.` })
          return;
        }
        libsSourceCode[libAdr] = libsc.source_code;
      }
      console.log('libsSourceCode:', libsSourceCode)
      const helperUrl = (process.env.HELPER_HOST || 'localhost') + ":" + (process.env.HELPER_PORT || '9090');
      let result = await axios.post(`http://${helperUrl}/api/verify/${address}`, {
        byteCode, sourceCode, abi, version, optimizer, versionFullName, optimizerRuns,
        isSingleFile, libs, libsSourceCode, evm, viaIR
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
        console.log('error msg:', e.message)
        res.status(400).send(e.message)
      }
    }
  });
  // The api to only get smart contract ABI by address
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