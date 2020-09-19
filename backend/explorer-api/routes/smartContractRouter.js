var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var solc = require('solc')

var smartContractRouter = (app) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to verify the source and bytecode
  router.get("/smartContract/verify", (req, res) => {
    let { sourceCode, byteCode, address, abi } = req.query;
    try {
      address = helper.normalize(address.toLowerCase());
      console.log('Verifing the source code and bytecode for address:', address);

      var input = {
        language: 'Solidity',
        sources: {
          'test.sol': {
            content: 'contract C { function f() public { } }'
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        }
      };
      var output = JSON.parse(
        solc.compile(JSON.stringify(input))
      );

      for (var contractName in output.contracts['test.sol']) {
        console.log(
          contractName +
          ': ' +
          output.contracts['test.sol'][contractName].evm.bytecode.object
        );
      }
      const data = ({
        "result": true
      });
      res.status(200).send(data);
    } catch (e) {
      res.status(400).send(e)
    }

  });
  // The api to get total amount of Theta
  router.get("/smartContract/:address", (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    console.log('Querying smart contract data for address:', address);
    const data = ({
      "address": address,
    });
    res.status(200).send(data);
  });



  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = smartContractRouter;