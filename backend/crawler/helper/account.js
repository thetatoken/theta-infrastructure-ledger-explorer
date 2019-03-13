var rpc = require('../api/rpc.js');

exports.updateAccount = async function (accountDao, accountTxDao, accountTxSendDao, transactionList) {
  // console.log('transactionList', transactionList);
  // transactionList.forEach(async function (tx) {
  for (let tx of transactionList) {
    switch (tx.type) { // TODO: Add other type cases
      case 0:
        for (let output of tx.data.outputs) {
          await _updateAccountByAddress(output.address, accountDao, tx.type);
          await _updateAccountTxMap(output.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        }
        break;
      case 2:
        // Update inputs account
        for (let input of tx.data.inputs) {
          await _updateAccountByAddress(input.address, accountDao, tx.type);
          await _updateAccountTxMap(input.address, tx.hash, tx.type, tx.timestamp, accountTxDao, accountTxSendDao);
        }
        // Update outputs account
        for (let output of tx.data.outputs) {
          await _updateAccountByAddress(output.address, accountDao, tx.type);
          await _updateAccountTxMap(output.address, tx.hash, tx.type, tx.timestamp, accountTxDao, accountTxSendDao);
        }
        break;
      case 3:
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.type);
        await _updateAccountTxMap(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break;
      case 5:
        // Update source account
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.type);
        await _updateAccountTxMap(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        // Update target account
        await _updateAccountByAddress(tx.data.target.address, accountDao, tx.type);
        await _updateAccountTxMap(tx.data.target.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break;
      case 6:
        await _updateAccountByAddress(tx.data.initiator.address, accountDao, tx.type);
        await _updateAccountTxMap(tx.data.initiator.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break;
      case 7:
      case 8:
        // Update source account
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.type);
        await _updateAccountTxMap(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao);

        // Update holder account
        await _updateAccountByAddress(tx.data.holder.address, accountDao, tx.type);
        await _updateAccountTxMap(tx.data.holder.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break
      default:
        break;
    }
  }
  // });
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
          'txs_counter': txs_counter
        });
      } else {
        return;
      }
    })
    .catch(err => {
      console.log(`Getting ${address} with:`, err);
      console.log('Start retry in 100ms.');
      setTimeout(function retry() {
        console.log('Retry of getting address:', address);
        _updateAccountByAddress(address, accountDao, type)
      }, 100);
    })
}

function _updateAccountTxMap(address, hash, type, timestamp, accountTxDao, accountTxSendDao) {
  accountTxDao.upsertInfoAsync({
    address,
    'tx_hash': hash,
    'tx_type': type,
    timestamp
  });
  if (type === 2) {
    accountTxSendDao.upsertInfoAsync({
      address,
      'tx_hash': hash,
      'tx_type': type,
      timestamp
    });
  }
}