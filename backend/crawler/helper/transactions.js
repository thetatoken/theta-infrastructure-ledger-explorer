exports.getBriefTxs = function (txs) {
    const res = []
    txs.forEach(tx => {
        tx = {
            hash: tx.hash,
            type: tx.type,
            raw: tx.raw.fee ? {
                fee: tx.raw.fee
            } : null
        }
        res.push(tx);
    });
    return res;
}