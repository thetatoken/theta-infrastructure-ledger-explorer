exports.normalize = function (hash) {
    const regex = /^0x/i;
    return regex.test(hash) ? hash : '0x' + hash;
}

exports.getBytecodeWithoutMetadata = function (bytecode) {
    // Last 4 chars of bytecode specify byte size of metadata component,
    const metadataSize = parseInt(bytecode.slice(-4), 16) * 2 + 4;
    const metadataStarts = bytecode.slice(bytecode.length - metadataSize, bytecode.length - metadataSize + 14)
    const endPoint = bytecode.indexOf(metadataStarts)
    return bytecode.slice(0, endPoint);
}

exports.getHex = function (str) {
    const buffer = Buffer.from(str, 'base64');
    const bufString = buffer.toString('hex');
    return '0x' + bufString;
}
exports.stampDate = function (sourceCode) {
    let date = new Date();
    const offset = date.getTimezoneOffset()
    date = new Date(date.getTime() - (offset * 60 * 1000))
    return `/**\n *Submitted for verification at thetatoken.org on ${date.toISOString().split('T')[0]}\n */\n` + sourceCode;
}
