exports.normalize = function (hash) {
    const regex = /^0x/i;
    return regex.test(hash) ? hash : '0x' + hash;
}