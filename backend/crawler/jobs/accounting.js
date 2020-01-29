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

exports.InitializeForTFuelPrice = function (accountingDaoInstance, coinbaseApiKeyStr, walletAddresses) {
    accountingDao = accountingDaoInstance;
    coinbaseApiKey = coinbaseApiKeyStr;
    walletAddrs = walletAddresses;
}

exports.RecordTFuelPrice = async function () {
    let tfuelPrice = await getCoinbasePrice();
    let [startTime] = getDayTimes();

    for (let addr of walletAddrs) {
        const data = { date: startTime, addr: addr, price: tfuelPrice };
        accountingDao.insertAsync(data);
    }
}

exports.InitializeForTFuelEarning = function (transactionDaoInstance, accountTransactionDaoInstance, accountingDaoInstance, walletAddresses) {
    txDao = transactionDaoInstance;
    acctTxDao = accountTransactionDaoInstance;
    accountingDao = accountingDaoInstance;
    walletAddrs = walletAddresses;
}

exports.RecordTFuelEarning = async function () {
    let [startTime, endTime] = getDayTimes();
    for (let addr of walletAddrs) {
        processEarning(addr, startTime, endTime);
    }
}

function getDayTimes() {
    var date = new Date();
    date.setUTCHours(0,0,0,0);
    var endTime = date.getTime() / 1000;
    date.setDate(date.getDate() - 1);
    var startTime = date.getTime() / 1000;
    return [startTime, endTime];
}

async function processEarning(address, startTime, endTime) {
    let txHashes = await acctTxDao.getTxHashesAsync(address, startTime.toString(), endTime.toString(), COINBASE);
    let hashes = [];
    txHashes.forEach(function(txHash){
      hashes.push(txHash.hash);
    });

    let txs = await txDao.getTransactionsByPkAsync(hashes);
    let totalTFuel = new BigNumber(0);
    for (let tx of txs) {
        for (let output of tx.data.outputs) {
            if (output.address === address) {
                totalTFuel = new BigNumber.sum(totalTFuel, new BigNumber(output.coins.tfuelwei));
                break;
            }
        }
    }

    const queryObj = { addr: address, date: startTime };
    const updateObj = { qty: Number(totalTFuel.dividedBy(WEI).toFixed(2)) };
    accountingDao.upsertAsync(queryObj, updateObj);
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