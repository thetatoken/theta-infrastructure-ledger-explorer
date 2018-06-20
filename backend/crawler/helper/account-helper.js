var rpc = require('../api/rpc.js');

exports.updateAccount = function (accountDao, transactionList) {
  transactionList.forEach(async function (tx) {
    switch (tx.type) { // TODO: Add other type cases
      case 1:
        await updateAccountByAddress(tx.data.outputs[0].address, accountDao, tx.hash);
        break;
      case 3:
        // Update inputs account
        await updateAccountByAddress(tx.data.inputs[0].address, accountDao, tx.hash);
        // Update outputs account
        await updateAccountByAddress(tx.data.outputs[0].address, accountDao, tx.hash);
        break;
      case 4:
        await updateAccountByAddress(tx.data.source.address, accountDao, tx.hash);
        break;
      case 6:
        // Update source account
        await updateAccountByAddress(tx.data.source.address, accountDao, tx.hash);
        // Update target account
        await updateAccountByAddress(tx.data.target.address, accountDao, tx.hash);
        break;
      case 7:
        await updateAccountByAddress(tx.data.initiator.address, accountDao, tx.hash);
        break;
      default:
        break;
    }
  });
};

function updateAccountByAddress(address, accountDao, hash) {
  rpc.getAccountAsync([{ 'address': address }])
    .then(async function (data) {
      let tmp = JSON.parse(data);
      const isExist = await accountDao.checkAccountAsync(hash);
      const txs_hash_list = isExist ? await accountDao.getAccountAsync(hash).txs_hash_list.push(hash) : [hash];
      // txs_hash_list.push(hash);
      await accountDao.upsertAccount({
        address,
        'balance': tmp.result.coins,
        'sequence':  tmp.result.sequence,
        'reserved_funds': tmp.result.reserved_funds,
        'last_updated_block_height': tmp.result.last_updated_block_height,
        'txs_hash_list': txs_hash_list
      });
    })
}