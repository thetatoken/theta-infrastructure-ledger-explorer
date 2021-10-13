var BigNumber = require('bignumber.js');
var WEI = 1000000000000000000;

exports.normalize = function (hash) {
    const regex = /^0x/i;
    return regex.test(hash) ? hash : '0x' + hash;
}

exports.sumCoin = function (weiAmountA, weiAmountB) {
    return BigNumber.sum(new BigNumber(weiAmountA), new BigNumber(weiAmountB))
}

exports.formatCoin = function (weiAmount) {
    return new BigNumber(weiAmount).dividedBy(WEI);
}

exports.validateHex = function (hash, limit = 64) {
    const reg = new RegExp("^(0x){0,1}[0-9a-f]{" + limit + "}$");
    return reg.test(hash);
}

exports.getHex = function (str) {
    const buffer = Buffer.from(str, 'base64');
    const bufString = buffer.toString('hex');
    return '0x' + bufString;
}