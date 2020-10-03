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

exports.getBytecodeWithoutMetadata = function (bytecode) {
    // Last 4 chars of bytecode specify byte size of metadata component,
    const metadataSize = parseInt(bytecode.slice(-4), 16) * 2 + 4;
    console.log('metadataSize:', metadataSize)
    return bytecode.slice(0, bytecode.length - metadataSize);
}

exports.getHex = function (str) {
    const buffer = Buffer.from(str, 'base64');
    const bufString = buffer.toString('hex');
    console.log(bufString.length)
    return '0x' + bufString;
}
exports.stampDate = function (sourceCode) {
    let date = new Date();
    const offset = date.getTimezoneOffset()
    date = new Date(date.getTime() - (offset * 60 * 1000))
    return `/**\n *Submitted for verification at thetatoken.org on ${date.toISOString().split('T')[0]}\n */\n` + sourceCode;
}