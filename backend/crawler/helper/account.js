var rpc = require('../api/rpc.js');
var Logger = require('./logger');

exports.updateAccount = async function (accountDao, accountTxDao, smartContractDao, dailyAccountDao, transactionList) {
  var counter = 0;
  transactionList.forEach(tx => {
    switch (tx.type) { // TODO: Add other type cases
      case 0:
        counter += tx.data.outputs ? tx.data.outputs.length + 1 : 1;
        break;
      case 2:
        counter += tx.data.inputs.length + tx.data.outputs.length;
        break;
      case 3:
        counter++;
        break;
      case 5:
        counter = counter + 2
        break;
      case 6:
        counter += tx.data.splits ? tx.data.splits.length + 1 : 1;
        break;
      case 7:
        counter = counter + 3;
      case 8:
      case 9:
      case 10:
        counter = counter + 2
        break
      default:
        break;
    }
  })
  Logger.log(`Number of upsert ACCOUNTS: ${counter}`);
  for (let tx of transactionList) {
    switch (tx.type) { // TODO: Add other type cases
      case 0:
        await _updateAccountByAddress(tx.data.proposer.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.proposer.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        for (let output of tx.data.outputs) {
          await _updateAccountByAddress(output.address, accountDao, tx.type);
          await _updateAccountMaps(output.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        }
        break;
      case 2:
        // Update inputs account
        for (let input of tx.data.inputs) {
          await _updateAccountByAddress(input.address, accountDao, tx.type);
          await _updateAccountMaps(input.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        }
        // Update outputs account
        for (let output of tx.data.outputs) {
          await _updateAccountByAddress(output.address, accountDao, tx.type);
          await _updateAccountMaps(output.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        }
        break;
      case 3:
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        break;
      case 5:
        // Update source account
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        // Update target account
        await _updateAccountByAddress(tx.data.target.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.target.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        break;
      case 6:
        await _updateAccountByAddress(tx.data.initiator.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.initiator.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        for (let split of tx.data.splits) {
          await _updateAccountByAddress(split.Address, accountDao, tx.type);
          await _updateAccountMaps(split.Address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        }
        break;
      case 7:
        // Update from account
        await _updateAccountByAddress(tx.data.from.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.from.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);

        // Update to account
        await _updateAccountByAddress(tx.data.to.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.to.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);

        // Update smart contract account
        if (tx.receipt) {
          if (tx.receipt.ContractAddress !== tx.data.to.address) {
            await _updateAccountByAddress(tx.receipt.ContractAddress, accountDao, tx.type);
            await _updateAccountMaps(tx.receipt.ContractAddress, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
            await _createSmartContract(tx.receipt.ContractAddress, tx.data.data, smartContractDao);
          }
        }
        break;
      case 8:
      case 9:
      case 10:
        // Update source account
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);

        // Update holder account
        await _updateAccountByAddress(tx.data.holder.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.holder.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        break;
      case 11:
        // Update holder account
        await _updateAccountByAddress(tx.data.holder.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.holder.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);

        // Update beneficiary account
        await _updateAccountByAddress(tx.data.beneficiary.address, accountDao, tx.type);
        await _updateAccountMaps(tx.data.beneficiary.address, tx.hash, tx.type, tx.timestamp, accountTxDao, dailyAccountDao);
        break;
      default:
        break;
    }
  }
};

exports.updateAccountByAddress = _updateAccountByAddress;

async function _updateAccountByAddress(address, accountDao, type) {
  await rpc.getAccountAsync([{ 'address': address }])
    .then(async function (data) {
      address = address;
      let tmp = JSON.parse(data);
      if (tmp.result) {
        const isExist = await accountDao.checkAccountAsync(address);
        const accountInfo = isExist ? await accountDao.getAccountByPkAsync(address) : null;
        let txs_counter = {};
        if (type !== null && type !== undefined) {
          if (accountInfo) {
            accountInfo.txs_counter = accountInfo.txs_counter || {};
            accountInfo.txs_counter[`${type}`] = accountInfo.txs_counter[`${type}`] === undefined ? 1 : accountInfo.txs_counter[`${type}`] + 1;
            txs_counter = accountInfo.txs_counter;
          } else {
            txs_counter = { [`${type}`]: 1 }
          }
        }
        await accountDao.upsertAccountAsync({
          address,
          'balance': tmp.result.coins,
          'sequence': tmp.result.sequence,
          'reserved_funds': tmp.result.reserved_funds,
          'txs_counter': txs_counter,
          'code': tmp.result.code
        });
      } else if (tmp.error) {
        const msg = tmp.error.message;
        if (msg.includes('is not found')) {
          const isExist = await accountDao.checkAccountAsync(address);
          if (isExist) {
            const accountInfo = await accountDao.getAccountByPkAsync(address);
            let txs_counter = {};
            if (type !== null && type !== undefined) {
              accountInfo.txs_counter = accountInfo.txs_counter || {};
              accountInfo.txs_counter[`${type}`] = accountInfo.txs_counter[`${type}`] === undefined ? 1 : accountInfo.txs_counter[`${type}`] + 1;
              txs_counter = accountInfo.txs_counter;
            }
            await accountDao.upsertAccountAsync({
              address,
              'balance': accountInfo.balance,
              'sequence': accountInfo.sequence,
              'reserved_funds': accountInfo.reserved_funds,
              'txs_counter': txs_counter,
              'code': accountInfo.code
            });
            return;
          };
          await accountDao.upsertAccountAsync({
            address,
            'balance': { "thetawei": "0", "tfuelwei": "0" },
            'sequence': 0,
            'reserved_funds': [],
            'txs_counter': { [`${type}`]: 1 },
            'code': '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'
          });
        }
      } else {
        return;
      }
    })
    .catch(err => {
      Logger.error(`Getting ${address} with:`, err);
      Logger.debug('Start retry in 100ms.');
      setTimeout(function retry() {
        Logger.debug('Retry of getting address:', address);
        _updateAccountByAddress(address, accountDao, type)
      }, 100);
    })
}

async function _updateAccountMaps(address, hash, type, timestamp, accountTxDao, dailyAccountDao) {
  accountTxDao.insertAsync({
    'acct': address,
    hash,
    type,
    'ts': timestamp
  });
  const isExist = await dailyAccountDao.checkAccountAsync(address);
  if (!isExist) {
    dailyAccountDao.insertAsync({ address })
  }
}

async function _createSmartContract(address, bytecode, smartContractDao) {
  const isExist = await smartContractDao.checkSmartContractAsync(address);
  if (!isExist) {
    smartContractDao.upsertSmartContractAsync({
      'address': address,
      'bytecode': bytecode,
      'abi': '',
      'source_code': '',
      'verification_date': '',
      'compiler_version': '',
      'optimizer': '',
      'name': ''
    });
  }
}