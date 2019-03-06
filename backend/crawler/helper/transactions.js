exports.getBriefTxs = function (txs) {
    txs.forEach(tx => {
        tx = {
            hash: tx.hash,
            type: tx.type
        }
    });
    return txs;
}