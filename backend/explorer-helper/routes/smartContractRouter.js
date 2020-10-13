var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var solc = require('solc');
var downloader = require('../helper/solcDownloader');

var smartContractRouter = (app) => {
  router.use(bodyParser.urlencoded({ extended: true }));

  // The api to verify the source and bytecode
  router.get("/verify/:address", async (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    let { sourceCode, byteCode, abi, version, optimizer } = req.query;
    console.log(`optimizer: ${optimizer}, type: ${typeof optimizer}, value: ${optimizer === '1'}`)
    try {
      console.log('Verifing the source code and bytecode for address:', address);
      let start = +new Date();
      var input = {
        language: 'Solidity',
        settings: {
          optimizer: {
            enabled: optimizer === '1'
          },
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        },
        sources: {
          'test.sol': {
            content: sourceCode
          }
        }
      };
      var output = '';
      // Todos: may need to run a separate node for the verification
      console.log(`load remote version starts.`)
      console.log(`version: ${version}`);
      let result = await downloader.downloadByVersion(version, './libs');
      console.log('result in smart contract router: ', result)
      console.log(`Download solc-js file takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date();
      const solcjs = solc.setupMethods(require('.' + result.fileName));
      console.log(`load solc-js version takes: ${(+new Date() - start) / 1000} seconds`)
      // console.log('solcjs: ', solcjs)
      // return;
      // const solcjs = await new Promise((resolve, reject) => {
      //   solc.loadRemoteVersion(version, (error, soljson) => {
      //     (error) ? reject(error) : resolve(soljson);
      //   });
      // });
      //solc.loadRemoteVersion(version, async function (err, solcjs) {
      // console.log(`load Remote version takes: ${(+new Date() - start) / 1000} seconds`)
      // if (err) {
      //   console.log('error in solc:', err)
      //   res.status(200).send({ result: { verified: false }, err_msg: err })
      //   return;
      // }
      // An error was encountered, display and quit
      start = +new Date();
      output = JSON.parse(solcjs.compile(JSON.stringify(input)))
      console.log(`compile takes ${(+new Date() - start) / 1000} seconds`)
      // console.log(`output:`, output)
      let check = {}
      if (output.errors) {
        check = output.errors.reduce((check, err) => {
          if (err.severity === 'warning') {
            if (!check.warnings) check.warnings = [];
            check.warnings.push(err.message);
          }
          if (err.severity === 'error') {
            check.error = err.message;
          }
          return check;
        }, {});
      }
      //console.log(`check:`, check)
      let data = {}
      let verified = false;
      if (check.error) {
        data = { result: { verified: false }, err_msg: check.error }
      } else {
        if (output.contracts) {
          let hexBytecode = helper.getHex(byteCode).substring(2);
          for (var contractName in output.contracts['test.sol']) {
            const curCode = output.contracts['test.sol'][contractName].evm.bytecode.object;
            const processed_compiled_bytecode = helper.getBytecodeWithoutMetadata(curCode);
            //console.log(`processed_compiled_bytecode: length:${processed_compiled_bytecode.length}`);
            //console.log(`processed_compiled_bytecode:`, processed_compiled_bytecode)
            const processed_blockchain_bytecode = helper.getBytecodeWithoutMetadata(hexBytecode.slice(0, curCode.length));
            const constructor_arguments = hexBytecode.slice(curCode.length);
            console.log(`contract name:`, contractName)
            console.log(`processed_blockchain_bytecode: length:${processed_blockchain_bytecode.length}`);
            console.log(`processed_compiled_bytecode: length:${processed_compiled_bytecode.length}`);
            console.log(processed_compiled_bytecode.localeCompare(processed_blockchain_bytecode))
            // if (contractName === 'SpecialVariablesAndFunctionsTest') verified = output.contracts['test.sol'][contractName];
            if (!processed_compiled_bytecode.localeCompare(processed_blockchain_bytecode) && processed_compiled_bytecode.length > 0) {
              verified = true;
              let abi = output.contracts['test.sol'][contractName].abi;
              // console.log('functions?:',output.contracts['test.sol'][contractName].evm.methodIdentifiers)
              // console.log('constructor_arguments codes:', constructor_arguments)
              //console.log(`Match the code, contractName:${contractName}`);
              //console.log('code:', curCode)
              //console.log(`abi: `, abi)
              const sc = {
                'address': address,
                'bytecode': byteCode,
                'abi': abi,
                'source_code': helper.stampDate(sourceCode),
                'verification_date': +new Date(),
                'compiler_version': version,
                'optimizer': optimizer === '1' ? 'enabled' : 'disabled',
                'name': contractName,
                'function_hash': output.contracts['test.sol'][contractName].evm.methodIdentifiers,
                'constructor_arguments': constructor_arguments
              }
              break;
            }
          }
        }
        data = { result: { verified }, warning_msg: check.warnings, smart_contract: sc }
      }
      // console.log(`res in verification:`, data)
      res.status(200).send(data);
      //});
    } catch (e) {
      console.log('Error in catch:', e)
      res.status(400).send(e)
    }
  });


  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = smartContractRouter;