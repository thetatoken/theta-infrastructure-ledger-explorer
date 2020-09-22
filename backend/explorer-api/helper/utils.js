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

exports.processBytecode = function (bytecode, version) {
    // Semantic versioning
    let solc_minor = parseInt(version.match(/v\d+?\.\d+?\.\d+?[+-]/gi)[0].match(/\.\d+/g)[0].slice(1))
    let solc_patch = parseInt(version.match(/v\d+?\.\d+?\.\d+?[+-]/gi)[0].match(/\.\d+/g)[1].slice(1))
    // console.log(`solc_minor: ${solc_minor}, solc_patch:${solc_patch}`)
    if (solc_minor >= 4 && solc_patch >= 22) {
        var starting_point = bytecode.lastIndexOf('6080604052');
        var ending_point = bytecode.search('a165627a7a72305820');
        return bytecode.slice(starting_point, ending_point);
    } else if (solc_minor >= 4 && solc_patch >= 7) {
        var starting_point = bytecode.lastIndexOf('6060604052');
        var ending_point = bytecode.search('a165627a7a72305820');
        return bytecode.slice(starting_point, ending_point);
    } else {
        return bytecode;
    }
}