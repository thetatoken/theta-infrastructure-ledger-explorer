var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
// var solc = require('solc');
var axios = require("axios").default;

var smartContractRouter = (app, smartContractDao) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to verify the source and bytecode
  router.get("/smartContract/verify/:address", async (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    let { sourceCode, abi, version, optimizer, versionFullName } = req.query;
    console.log('Received API.')
    console.log(`optimizer: ${optimizer}, type: ${typeof optimizer}, value: ${optimizer === '1'}`)
    try {
      let sc = await smartContractDao.getSmartContractByAddressAsync(address)
      let byteCode = sc.bytecode;
      let result = await axios.get(`http://localhost:9090/api/verify/${address}`, {
        params: { byteCode, sourceCode, abi, version, optimizer, versionFullName }
      })
      // console.log(result.data)
      console.log(typeof result.data.result.verified)
      if(result.data.result.verified === true){
        console.log("I'm true!")
        let newSc = {...result.data.smart_contract, bytecode: byteCode}
        console.log(newSc)
        await smartContractDao.upsertSmartContractAsync(newSc);
      }
      const data = {
        result: result.data.result,
        err_msg: result.data.err_msg,
        warning_msg: result.data.warning_msg
      }
      res.status(200).send(data)
    } catch (e) {
      if(e.response){
        console.log('Error in catch:', e.response.status)
        res.status(400).send(e.response.status)
      }else{
        res.status(400).send(e)
      }

    }
    // return;
    // // for quick insert
    // // const sc = {
    // //   'address': address,
    // //   'bytecode': byteCode,
    // //   'abi': '',
    // //   'source_code': '',
    // //   'verification_date': '',
    // //   'compiler_version': '',
    // //   'optimizer': '',
    // //   'name': ''
    // // }
    // // await smartContractDao.upsertSmartContractAsync(sc);
    // // res.status(200).send({res: 'testing'});
    // // console.log(`sourceCode: ${sourceCode}, abi: ${abi}, version: ${version}, address: ${address}, byteCode: ${byteCode}`)
    // try {
    //   console.log('Verifing the source code and bytecode for address:', address);
    //   let start = +new Date();
    //   var input = {
    //     language: 'Solidity',
    //     settings: {
    //       optimizer: {
    //         enabled: optimizer === '1'
    //       },
    //       outputSelection: {
    //         '*': {
    //           '*': ['*']
    //         }
    //       },
    //       // metadata: {
    //       //   // Use only literal content and not URLs (false by default)
    //       //   "useLiteralContent": true,
    //       //   // Use the given hash method for the metadata hash that is appended to the bytecode.
    //       //   // The metadata hash can be removed from the bytecode via option "none".
    //       //   // The other options are "ipfs" and "bzzr1".
    //       //   // If the option is omitted, "ipfs" is used by default.
    //       //   "bytecodeHash": "ipfs"
    //       // },
    //     },
    //     sources: {
    //       'test.sol': {
    //         content: sourceCode
    //       }
    //     }
    //   };
    //   var output = '';
    //   // Todos: may need to run a separate node for the verification
    //   console.log(`load remote version starts.`)
    //   const solcjs = await new Promise((resolve, reject) => {
    //     solc.loadRemoteVersion(version, (error, soljson) => {
    //       (error) ? reject(error) : resolve(soljson);
    //     });
    //   });
    //   //solc.loadRemoteVersion(version, async function (err, solcjs) {
    //   console.log(`load Remote version takes: ${(+new Date() - start) / 1000} seconds`)
    //   // if (err) {
    //   //   console.log('error in solc:', err)
    //   //   res.status(200).send({ result: { verified: false }, err_msg: err })
    //   //   return;
    //   // }
    //   // An error was encountered, display and quit
    //   start = +new Date();
    //   output = JSON.parse(solcjs.compile(JSON.stringify(input)))
    //   console.log(`compile takes ${(+new Date() - start) / 1000} seconds`)
    //   // console.log(`output:`, output)
    //   let check = {}
    //   if (output.errors) {
    //     check = output.errors.reduce((check, err) => {
    //       if (err.severity === 'warning') {
    //         if (!check.warnings) check.warnings = [];
    //         check.warnings.push(err.message);
    //       }
    //       if (err.severity === 'error') {
    //         check.error = err.message;
    //       }
    //       return check;
    //     }, {});
    //   }
    //   //console.log(`check:`, check)
    //   let data = {}
    //   let verified = false;
    //   if (check.error) {
    //     data = { result: { verified: false }, err_msg: check.error }
    //   } else {
    //     if (output.contracts) {
    //       let hexBytecode = helper.getHex(byteCode).substring(2);
    //       for (var contractName in output.contracts['test.sol']) {
    //         const curCode = output.contracts['test.sol'][contractName].evm.bytecode.object;
    //         const processed_compiled_bytecode = helper.getBytecodeWithoutMetadata(curCode);
    //         //console.log(`processed_compiled_bytecode: length:${processed_compiled_bytecode.length}`);
    //         //console.log(`processed_compiled_bytecode:`, processed_compiled_bytecode)
    //         const processed_blockchain_bytecode = helper.getBytecodeWithoutMetadata(hexBytecode.slice(0, curCode.length));
    //         const constructor_arguments = hexBytecode.slice(curCode.length);
    //         console.log(`contract name:`, contractName)
    //         console.log(`processed_blockchain_bytecode: length:${processed_blockchain_bytecode.length}`);
    //         console.log(`processed_compiled_bytecode: length:${processed_compiled_bytecode.length}`);
    //         console.log(processed_compiled_bytecode.localeCompare(processed_blockchain_bytecode))
    //         // if (contractName === 'SpecialVariablesAndFunctionsTest') verified = output.contracts['test.sol'][contractName];
    //         if (!processed_compiled_bytecode.localeCompare(processed_blockchain_bytecode) && processed_compiled_bytecode.length > 0) {
    //           verified = true;
    //           let abi = output.contracts['test.sol'][contractName].abi;
    //           // console.log('functions?:',output.contracts['test.sol'][contractName].evm.methodIdentifiers)
    //           // console.log('constructor_arguments codes:', constructor_arguments)
    //           //console.log(`Match the code, contractName:${contractName}`);
    //           //console.log('code:', curCode)
    //           //console.log(`abi: `, abi)
    //           const sc = {
    //             'address': address,
    //             'bytecode': byteCode,
    //             'abi': abi,
    //             'source_code': helper.stampDate(sourceCode),
    //             'verification_date': +new Date(),
    //             'compiler_version': version,
    //             'optimizer': optimizer === '1' ? 'enabled' : 'disabled',
    //             'name': contractName,
    //             'function_hash': output.contracts['test.sol'][contractName].evm.methodIdentifiers,
    //             'constructor_arguments': constructor_arguments
    //           }
    //           await smartContractDao.upsertSmartContractAsync(sc);
    //           break;
    //         }
    //       }
    //     }
    //     data = { result: { verified }, warning_msg: check.warnings }
    //   }
    //   // console.log(`res in verification:`, data)
    //   res.status(200).send(data);
    //   //});
    // } catch (e) {
    //   console.log('Error in catch:', e)
    //   res.status(400).send(e)
    // }

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