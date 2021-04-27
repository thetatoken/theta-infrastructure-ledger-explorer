var BigNumber = require('bignumber.js');
var bluebird = require("bluebird");
var { createIndex } = require('../../mongo-db/mongo-client.js');

exports.sumCoin = function (weiAmountA, weiAmountB) {
    return BigNumber.sum(new BigNumber(weiAmountA), new BigNumber(weiAmountB))
}
exports.timeCoin = function(amountA, amountB) {
    return new BigNumber(amountA).times(amountB);
}
exports.createIndexes = async function () {
    const createIndexAsync = bluebird.promisify(_createIndex);
    await createIndexAsync('block', { timestamp: -1 })

    await createIndexAsync('transaction', { number: 1 })
    await createIndexAsync('transaction', { status: 1 })
    await createIndexAsync('transaction', { timestamp: -1 })
    await createIndexAsync('transaction', { number: 1, status: 1 })
    await createIndexAsync('transaction', { number: -1, status: 1 })

    await createIndexAsync('acctTx', { acct: 1, hash: 1 })
    await createIndexAsync('acctTx', { acct: 1, ts: 1 })
    await createIndexAsync('acctTx', { acct: 1, type: 1, ts: 1 })

    await createIndexAsync('account', { "balance.thetawei": -1 })
    await createIndexAsync('account', { "balance.tfuelwei": -1 })

    await createIndexAsync('stake', { type: 1 })
    await createIndexAsync('stake', { type:1, holder:1 })
    await createIndexAsync('stake', { type:1, source:1 })

    await createIndexAsync('accounting', { addr: 1, date: 1 })

    await createIndexAsync('checkpoint', { height: -1 })

    await createIndexAsync('activeAct', { timestamp: -1 })

    await createIndexAsync('totalAct', { timestamp: -1 })
}
function _createIndex(collectionName, object, callback) {
    createIndex(collectionName, object, callback);
}
