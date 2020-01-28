const BigNumber = require('bignumber.js');
const rp = require('request-promise');
const COINBASE = 0;
const WEI = 1000000000000000000;
const TFUEL_ID = '3822';

BigNumber.config({ EXPONENTIAL_AT: 1e+9 });

let txDao = null;
let acctTxDao = null;
let accountingDao = null;
let coinbaseApiKey = null;
let walletAddrs = null;

exports.Initialize = function (transactionDaoInstance, accountTransactionDaoInstance, accountingDaoInstance, coinbaseApiKeyStr, walletAddresses) {
    txDao = transactionDaoInstance;
    acctTxDao = accountTransactionDaoInstance;
    accountingDao = accountingDaoInstance;
    coinbaseApiKey = coinbaseApiKeyStr;
    walletAddrs = walletAddresses;
}

exports.Execute = async function () {
    let tfuelPrice = await getCoinbasePrice();
    for (let addr of walletAddrs) {
        process(addr, tfuelPrice);
    }
}

async function process(address, tfuelPrice) {
    var date = new Date();
    let now = date.getTime();
    date.setUTCHours(0,0,0,0)
    var endTime = date.getTime() / 1000;
    date.setDate(date.getDate() - 1);
    var startTime = date.getTime() / 1000;

    let txHashes = await acctTxDao.getTxHashesAsync(address, startTime.toString(), endTime.toString(), COINBASE);
    let hashes = [];
    txHashes.forEach(function(txHash){
      hashes.push(txHash.hash);
    });

    let txs = await txDao.getTransactionsByPkAsync(hashes);
    let totalTFuel = 0;
    for (let tx of txs) {
        for (let output of tx.data.outputs) {
            if (output.address === address) {
                totalTFuel = BigNumber.sum(totalTFuel, new BigNumber(output.coins.tfuelwei));
                break;
            }
        }
    }

    const data = { date: now, addr: address, qty: Number(totalTFuel.dividedBy(WEI).toFixed(2)), price: tfuelPrice };
    accountingDao.insertAsync(data);
}

function getCoinbasePrice() {
    const requestOptions = {
        method: 'GET',
        uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        qs: {
            'id': TFUEL_ID
        },
        headers: {
            'X-CMC_PRO_API_KEY': coinbaseApiKey
        },
        json: true,
        gzip: true
    };

    return rp(requestOptions).then(res => {
        return res.data[TFUEL_ID].quote.USD.price
    }).catch((err) => {
        console.log('Coinbase API call error:', err.message);
    });
}