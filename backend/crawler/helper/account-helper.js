var rpc = require('../api/rpc.js');

exports.updateAccount = function (accountDao, transactionList) {
  // console.log('transactionList', transactionList);
  transactionList.forEach(async function (tx) {
    switch (tx.type) { // TODO: Add other type cases
      case 0:
        await _updateAccountByAddress(tx.data.outputs[0].address, accountDao, tx.hash);
        break;
      case 2:
        // Update inputs account
        await _updateAccountByAddress(tx.data.inputs[0].address, accountDao, tx.hash);
        // Update outputs account
        await _updateAccountByAddress(tx.data.outputs[0].address, accountDao, tx.hash);
        break;
      case 3:
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.hash);
        break;
      case 5:
        // Update source account
        await _updateAccountByAddress(tx.data.source.address, accountDao, tx.hash);
        // Update target account
        await _updateAccountByAddress(tx.data.target.address, accountDao, tx.hash);
        break;
      case 6:
        await _updateAccountByAddress(tx.data.initiator.address, accountDao, tx.hash);
        break;
      default:
        break;
    }
  });
};

exports.updateAccountByAddress = _updateAccountByAddress;

function _updateAccountByAddress(address, accountDao, hash) {
  rpc.getAccountAsync([{ 'address': address }])
    .then(async function (data) {
      address = address.toUpperCase();
      let tmp = JSON.parse(data);
      const isExist = await accountDao.checkAccountAsync(address);
      const accountInfo = isExist ? await accountDao.getAccountByPkAsync(address) : null;
      const txs_hash_list = accountInfo ? [hash].concat(accountInfo.txs_hash_list.slice(0, 99)) : hash ? [hash] : [];
      await accountDao.upsertAccountAsync({
        address,
        'balance': tmp.result.coins,
        'sequence': tmp.result.sequence,
        'reserved_funds': tmp.result.reserved_funds,
        // 'last_updated_block_height': tmp.result.last_updated_block_height,
        'txs_hash_list': txs_hash_list
      });
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