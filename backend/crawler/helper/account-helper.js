var rpc = require('../api/rpc.js');

exports.updateAccount = function (accountDao, transactionList, callback) {
  transactionList.forEach(async function (tx) {
    switch (tx.type) { // TODO: Add other type cases
      case 1:
        await updateAccountByAddress(tx.data.outputs[0].address, accountDao);
        break;
      case 3:
        // Update inputs account
        await updateAccountByAddress(tx.data.inputs[0].address, accountDao);
        // Update outputs account
        await updateAccountByAddress(tx.data.outputs[0].address, accountDao);
        break;
      case 4:
        await updateAccountByAddress(tx.data.source.address, accountDao);
        break;
      case 6:
        // Update source account
        await updateAccountByAddress(tx.data.source.address, accountDao);
        // Update target account
        await updateAccountByAddress(tx.data.target.address, accountDao);
        break;
      case 7:
        await updateAccountByAddress(tx.data.initiator.address, accountDao);
        break;
      default:
        break;
    }
  });
};

function updateAccountByAddress(address, accountDao) {
  rpc.getAccountAsync([{ 'address': address }])
    .then(async function (data) {
      let tmp = JSON.parse(data);
      await accountDao.upsertAccount({ address, 'balance': tmp.result.coins });
    })
}