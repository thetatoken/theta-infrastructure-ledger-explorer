var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var helper = require('../helper/utils');
var solc = require('solc');
var downloader = require('../helper/solcDownloader');
var fs = require('fs');
var path = require('path');

var smartContractRouter = (app) => {
  router.use(bodyParser.urlencoded({ extended: true }));
  router.use(bodyParser.json({ limit: '1mb' }));

  // The api to verify the source and bytecode
  router.post("/verify/:address", async (req, res) => {
    let address = helper.normalize(req.params.address.toLowerCase());
    let { sourceCode, byteCode, abi, version, versionFullName, optimizer, optimizerRuns = 200, isSingleFile = true } = req.body;
    console.log('isSingleFile:', isSingleFile)
    optimizerRuns = +optimizerRuns;
    if (Number.isNaN(optimizerRuns)) optimizerRuns = 200;
    try {
      console.log('Verifing the source code and bytecode for address:', address);
      const sourcecodes = isSingleFile ? {
        'test.sol': {
          content: sourceCode
        }
      } : JSON.parse(sourceCode);
      // console.log('sourcecodes:', sourcecodes);
      let start = +new Date();
      var input = {
        language: 'Solidity',
        settings: {
          optimizer: {
            enabled: optimizer === '1',
            runs: optimizerRuns
          },
          outputSelection: {
            '*': {
              '*': ['*']
            }
          }
        },
        sources: sourcecodes
      };

      // console.log('input:', input);
      var output = '';
      console.log(`Loading specific version starts.`)
      console.log(`version: ${version}`);
      const prefix = './libs';
      const fileName = prefix + '/' + versionFullName;
      if (!fs.existsSync(fileName)) {
        console.log(`file ${fileName} does not exsit, downloading`)
        await downloader.downloadByVersion(version, './libs');
      } else {
        console.log(`file ${fileName} exsits, skip download process`)
      }
      console.log(`Download solc-js file takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date();
      const solcjs = solc.setupMethods(require('.' + fileName));
      console.log(`load solc-js version takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date();

      const imports = sourceCode.match(/import\s+"(\@openzeppelin\/contracts\/.+\.sol)"/g) || [];
      // console.log('imports:', imports)
      const importedFiles = [...new Set(imports.map((match) => match.replace(/import\s+"/g, '').replace(/"/g, '')))];
      // console.log('importedFiles:', importedFiles)
      helper.getImportedContracts(importedFiles, input);
      console.log('input.sources:', [...Object.keys(input.sources)])
      console.log(`getImportedContracts takes: ${(+new Date() - start) / 1000} seconds`)
      start = +new Date();
      output = JSON.parse(solcjs.compile(JSON.stringify(input)))
      console.log(`compile takes ${(+new Date() - start) / 1000} seconds`)
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
      let data = {}
      let verified = false;
      let sc;
      if (check.error) {
        data = { result: { verified: false }, err_msg: check.error }
      } else {
        // console.log('output.contracts.MyContract.sol:', output);
        if (output.contracts) {
          let hexBytecode = helper.getHex(byteCode).substring(2);
          // console.log('hexBytecode:', hexBytecode);
          for (var cFileName in output.contracts) {
            // console.log('cFileName:', cFileName)
            for (var contractName in output.contracts[cFileName]) {
              const byteCode = output.contracts[cFileName][contractName].evm.bytecode.object;
              const deployedBytecode = output.contracts[cFileName][contractName].evm.deployedBytecode.object;
              const processed_compiled_bytecode = helper.getBytecodeWithoutMetadata(deployedBytecode);
              // const processed_blockchain_bytecode = helper.getBytecodeWithoutMetadata(hexBytecode.slice(0, curCode.length));
              const constructor_arguments = hexBytecode.slice(byteCode.length);
              // const linkReferences = output.contracts[cFileName][contractName].evm.bytecode.linkReferences;
              // console.log(`contract name:`, contractName)
              // console.log(`processed_blockchain_bytecode: length:${processed_blockchain_bytecode.length}`);
              // console.log(`processed_compiled_bytecode: length:${processed_compiled_bytecode.length}`);
              // console.log(`processed_compiled_bytecode: ${processed_compiled_bytecode}`);
              // console.log(`hexBytecode: length:${hexBytecode.length}`);
              // console.log('linkReferences:', linkReferences)
              // Object.keys(linkReferences).forEach((lFName) => {
              //   Object.keys(linkReferences[lFName]).forEach(cName => {
              //     Object.entries(linkReferences[lFName][cName]).forEach(([libraryName, libraryAddress]) => {
              //       const libraryAddressHex = `__${libraryName}_+`;

              //       console.log('libraryName:', libraryName)
              //       console.log('libraryAddress:', libraryAddress)
              //       console.log('libraryAddressHex:', libraryAddressHex)
              //       // if (!linkedBytecode.includes(libraryAddressHex)) {
              //       //   throw new Error(`Library ${libraryName} address ${libraryAddress} not found in contract ${contractName} bytecode`);
              //       // }
              //     });
              //   })
              // })

              // console.log(processed_compiled_bytecode.localeCompare(processed_blockchain_bytecode))
              if (hexBytecode.indexOf(processed_compiled_bytecode) > -1 && processed_compiled_bytecode.length > 0) {
                verified = true;
                let abi = output.contracts[cFileName][contractName].abi;
                const breifVersion = versionFullName.match(/^soljson-(.*).js$/)[1];
                sc = {
                  'address': address,
                  'abi': abi,
                  'source_code': helper.stampDate(helper.flatSourceCode(input.sources)),
                  'verification_date': +new Date(),
                  'compiler_version': breifVersion,
                  'optimizer': optimizer === '1' ? 'enabled' : 'disabled',
                  'optimizerRuns': optimizerRuns,
                  'name': contractName,
                  'function_hash': output.contracts[cFileName][contractName].evm.methodIdentifiers,
                  'constructor_arguments': constructor_arguments
                }
                break;
              }
            }
          }
        }
        data = { result: { verified }, warning_msg: check.warnings, smart_contract: sc }
      }
      console.log(`Source code verification result: ${verified}, sending back result`);
      res.status(200).send(data);
    } catch (e) {
      console.log('Error in catch:', e)
      res.status(400).send(e)
    }
  });


  //the / route of router will get mapped to /api
  app.use('/api', router);
}

module.exports = smartContractRouter;