var BigNumber = require('bignumber.js');

exports.normalize = function (hash) {
    const regex = /^0x/i;
    return regex.test(hash) ? hash : '0x' + hash;
}

exports.sumCoin = function (weiAmountA, weiAmountB) {
    return BigNumber.sum(new BigNumber(weiAmountA), new BigNumber(weiAmountB))
}