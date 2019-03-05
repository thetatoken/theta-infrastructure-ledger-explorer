var rpc = require('../api/rpc.js');

exports.updateAccount = async function (accountDao, accountTxDao, transactionList) {
  // console.log('transactionList', transactionList);
  // transactionList.forEach(async function (tx) {
  for (let tx of transactionList) {
    switch (tx.type) { // TODO: Add other type cases
      case 0:
        for (let output of tx.data.outputs) {
          await _updateAccountByAddress(output.address, accountDao, tx.hash);
          await _updateAccountTxMap(output.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        }
        break;
      case 2:
        // Update inputs account
        for (let input of tx.data.inputs) {
          await _updateAccountByAddress(input.address, accountDao, tx.hash);
          await _updateAccountTxMap(input.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        }
        // Update outputs account
        for (let output of tx.data.outputs) {
          await _updateAccountByAddress(output.address, accountDao, tx.hash);
          await _updateAccountTxMap(output.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        }
        break;
      case 3:
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.hash);
        await _updateAccountTxMap(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break;
      case 5:
        // Update source account
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.hash);
        await _updateAccountTxMap(tx.data.source.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        // Update target account
        await _updateAccountByAddress(tx.data.target.address, accountDao, tx.hash);
        await _updateAccountTxMap(tx.data.target.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break;
      case 6:
        await _updateAccountByAddress(tx.data.initiator.address, accountDao, tx.hash);
        await _updateAccountTxMap(tx.data.initiator.address, tx.hash, tx.type, tx.timestamp, accountTxDao);
        break;
      default:
        break;
    }
  }
  // });
};

exports.updateAccountByAddress = _updateAccountByAddress;

function _updateAccountByAddress(address, accountDao, hash) {
  rpc.getAccountAsync([{ 'address': address }])
    .then(async function (data) {
      address = address.toUpperCase();
      let tmp = JSON.parse(data);
      if (tmp.result) {
        const isExist = await accountDao.checkAccountAsync(address);
        const accountInfo = isExist ? await accountDao.getAccountByPkAsync(address) : null;
        const txs_hash_list = accountInfo ? hash ? [hash].concat(accountInfo.txs_hash_list.slice(0, 99)) : accountInfo.txs_hash_list : hash ? [hash] : [];
        await accountDao.upsertAccountAsync({
          address,
          'balance': tmp.result.coins,
          'sequence': tmp.result.sequence,
          'reserved_funds': tmp.result.reserved_funds,
          // 'last_updated_block_height': tmp.result.last_updated_block_height,
          'txs_hash_list': txs_hash_list
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
        _updateAccountByAddress(address, accountDao, hash)
      }, 100);
    })
}

function _updateAccountTxMap(address, hash, type, timestamp, accountTxDao) {
  accountTxDao.upsertInfoAsync({
    address,
    'tx_hash': hash,
    'tx_type': type,
    timestamp
  });
}