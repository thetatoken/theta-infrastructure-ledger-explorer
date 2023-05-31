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

exports.getTokenAddress = function (token) {
    const tokenAddressMap = {
        'tdrop': '0x1336739b05c7ab8a526d40dcc0d04a826b5f8b03',
        'lavita': '0x46fbf4487fa1b9c70d35bd761c51c360df9459ed'
    }
    return tokenAddressMap[token];
}