import { BigNumber } from 'bignumber.js';
// import _ from 'lodash';

import { TxnTypes, WEI } from 'common/constants';
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

const rp = require('request-promise');

let txDao = null;
let acctTxDao = null;
let accountingDao = null;
let walletAddrs = [
    '0xfa7393eb179fdb4202229ef00607b41c1ccedc7f', 
    '0x3de1b09087d18667cee078e02353d39a855bd79d', 
    '0x3d38a88684b5489ab05084d24e7a164263332eaa'
];

exports.Initialize = function (transactionDaoInstance, accountTransactionDaoInstance, accountingDaoInstance) {
    txDao = transactionDaoInstance;
    acctTxDao = accountTransactionDaoInstance;
    accountingDao = accountingDaoInstance;
}

exports.Execute = function () {
    let tfuelPrice = getCoinbasePrice();
    for (let addr of walletAddrs) {
        process(addr, tfuelPrice);
    }
}

function process(address, tfuelPrice) {
    var date = new Date();
    let now = date.getTime();
    date.setUTCHours(0,0,0,0)
    var endTime = date.getTime() / 1000;
    date.setDate(date.getDate() - 1);
    var startTime = date.getTime() / 1000;

    // const endTime = Math.ceil(Date.now() / 1000).toString();
    let txHashes = await acctTxDao.getTxHashesAsync(address, startTime, endTime, TxnTypes.COINBASE);
    let txs = await txDao.getTransactionsByPkAsync(txHashes);
    let totalTFuel = 0;
    for (let tx of txs) {
        for (let output of tx.data.outputs) {
            if (output.address === address) {
                totalTFuel += BigNumber(output.coins.tfuelwei).dividedBy(WEI);
                break;
            }
        }
    }

    const data = { date: now, addr: address, qty: totalTFuel, price: tfuelPrice };
    accountingDao.insertAsync(data);
}

function getCoinbasePrice() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        qs: {
            'id': '1'
        },
        headers: {
            'X-CMC_PRO_API_KEY': ''
        },
        json: true,
        gzip: true
    };

    return rp(requestOptions).then(res => {
        return json.data["1"].quote.USD.price
    }).catch((err) => {
        console.log('Coinbase API call error:', err.message);
    });
}