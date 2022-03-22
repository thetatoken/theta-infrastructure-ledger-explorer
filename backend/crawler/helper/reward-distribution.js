var helper = require('./utils');
var Logger = require('./logger');

var cacheRef = new Map();
var cacheKeyRef = new Set()

function shallowEqual(object1, object2) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }
  return true;
}

async function updateRewardDistributionWithCache(list, rewardDistributionDao) {
  if (cacheKeyRef.size === 0) {
    await rewardDistributionDao.removeAllAsync();
  }
  let updateList = [];
  let existKeys = new Set(cacheKeyRef);
  for (let ruleSet of list) {
    const id = ruleSet.StakeHolder;
    if (existKeys.has(id)) {
      existKeys.delete(id);
      if (!shallowEqual(cacheRef.get(id), ruleSet)) {
        updateList.push(ruleSet);
        cacheRef.set(id, ruleSet);
      }
    } else {
      updateList.push(ruleSet);
      cacheKeyRef.add(id);
      cacheRef.set(id, ruleSet);
    }
  }

  let deleteKeys = [...existKeys];
  for (let rule of updateList) {
    const data = {
      _id: rule.StakeHolder,
      beneficiary: rule.Beneficiary,
      splitBasisPoint: rule.SplitBasisPoint
    }
    await rewardDistributionDao.insertAsync(data);
  }
  Logger.log('reward distribution updateList length:', updateList.length);
  Logger.log('reward distribution delete keys length:', deleteKeys.length);
  await rewardDistributionDao.removeRecordsByIdAsync(deleteKeys);
  for (let key of deleteKeys) {
    cacheRef.delete(key);
    cacheKeyRef.delete(key);
  }
}

exports.updateRewardDistribution = async function (ruleSetPairs, rewardDistributionDao) {
  let insertList = [];
  ruleSetPairs.forEach(pair => {
    pair.StakeRewardDistributionRuleSet(ruleSet => {
      const data = {
        _id: ruleSet.StakeHolder,
        beneficiary: ruleSet.Beneficiary,
        splitBasisPoint: ruleSet.SplitBasisPoint
      }
      insertList.push(rewardDistributionDao.insertAsync(data));
    })
  })
  await Promise.all(insertList);
}
exports.updateRewardDistributions = async function (list, rewardDistributionDao, cacheEnabled) {
  if (cacheEnabled) {
    await updateRewardDistributionWithCache(list, rewardDistributionDao);
    return;
  }
  await rewardDistributionDao.updateRewardDistributionsAsync(list);
}

