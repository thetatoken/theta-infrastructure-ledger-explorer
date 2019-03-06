exports.getBriefTxs = function (txs) {
    const res = []
    txs.forEach(tx => {
        tx = {
            hash: tx.hash,
            type: tx.type
        }
        res.push(tx);
    });
    return res;
}