//------------------------------------------------------------------------------
//  DAO for Reward Distribution
//------------------------------------------------------------------------------

module.exports = class rewardDistributionDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'rewardDistribution';
  }

  insert(info, callback) {
    const queryObject = { _id: info._id }
    this.client.upsert(this.collection, queryObject, info, callback);
  }

  getRewardDistributionByAddress(address, callback) {
    const queryObject = { _id: address };
    this.client.query(this.collection, queryObject, function (error, record) {
      if (error) {
        console.log('getRewardDistributionByAddress ERR - ', error);
        callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND - All Stakes'));
      } else {
        callback(error, record)
      }
    })
  }

  getAllRewardDistribution(callback) {
    this.client.findAll(this.collection, function (error, recordList) {
      if (error) {
        console.log('getAllRewardDistribution ERR - ', error);
        callback(error);
      } else if (!recordList) {
        callback(Error('NOT_FOUND - All Reward Distribution'));
      } else {
        callback(error, recordList)
      }
    })
  }

  async updateRewardDistributions(list, callback) {
    await this.removeAllAsync();
    for (let info of list) {
      const rewardDistributionInfo = {
        _id: info.stakeHolder,
        beneficiary: info.beneficiary,
        splitBasisPoint: info.splitBasisPoint
      }
      await this.insertAsync(rewardDistributionInfo);
    }
    callback();
  }

  removeRecordsById(ids, callback) {
    const queryObject = { _id: { $in: ids } };
    this.client.remove(this.collection, queryObject, async function (err, res) {
      if (err) {
        console.log('Reward Distribution dao removeRecordsById ERR - ', err, ids);
        callback(err);
      }
      callback(err, res);
    })
  }

  removeAll(callback) {
    const queryObject = {};
    this.client.remove(this.collection, queryObject, function (err, res) {
      if (err) {
        console.log('Reward Distribution dao removeAll ERR - ', err);
        callback(err);
      }
      callback(err, res);
    })
  }
}