var Logger = require('../helper/logger');
var rpc = require('../api/rpc.js');
var helper = require('../helper/utils');
const { default: BigNumber } = require('bignumber.js');

let activeActDao = null;
let dailyAccountDao = null;
let totalActDao = null;
let accountDao = null;
let dailyTfuelBurntDao = null;

exports.Initialize = function (dailyAccountDaoInstance, activeActDaoInstance, totalActDaoInstance, accountDaoInstance, dailyTfuelBurntDaoInstance) {
  dailyAccountDao = dailyAccountDaoInstance;
  activeActDao = activeActDaoInstance;
  totalActDao = totalActDaoInstance;
  accountDao = accountDaoInstance;
  dailyTfuelBurntDao = dailyTfuelBurntDaoInstance;
}

exports.Execute = function () {
  let timestamp = (new Date().getTime() / 1000).toFixed();
  dailyAccountDao.getTotalNumberAsync()
    .then(async res => {
      await activeActDao.insertAsync({ amount: res, timestamp });
      await dailyAccountDao.removeAllAsync();
    }).catch(err => {
      Logger.log('error from daily account getTotalNumber:', err);
    })
  accountDao.getTotalNumberAsync()
    .then(async res => {
      await totalActDao.insertAsync({ amount: res, timestamp });
    }).catch(err => {
      Logger.log('error from account getTotalNumber:', err);
    })
  dailyTfuelBurntDao.getLatestRecordAsync()
    .then(async res => {
      _dailyTfuelBurntInsert(res);
    }).catch(err => {
      Logger.log('error from getLatestRecordAsync:', err);
      if (err.message.includes('NO_RECORD')) {
        _dailyTfuelBurntInsert();
      }
    })
}

async function _dailyTfuelBurntInsert(preData) {
  let timestamp = (new Date().getTime() / 1000).toFixed();
  try {
    let response = await rpc.getAccountAsync([{ 'address': '0x0' }]);
    let account = JSON.parse(response).result;
    const addressZeroBalance = account ? account.coins.tfuelwei : 0;
    const feeInfo = await progressDao.getFeeAsync()
    const burntAmount = helper.sumCoin(addressZeroBalance, feeInfo.total_fee);
    let dailyTfuelBurnt = '0';
    if (preData) {
      dailyTfuelBurnt = burntAmount.minus(new BigNumber(preData.totalTfuelBurnt)).toFixed();
    }
    await dailyTfuelBurntDao.insertAsync({
      timestamp,
      dailyTfuelBurnt,
      totalTfuelBurnt: burntAmount.toFixed()
    })
  } catch (err) {
    Logger.log('error from getLatestRecordAsync try catch:', err);
  }
}