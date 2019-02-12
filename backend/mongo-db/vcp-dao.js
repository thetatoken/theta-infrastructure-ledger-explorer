var path = require('path');
//------------------------------------------------------------------------------
//  DAO for vcp
//------------------------------------------------------------------------------

module.exports = class VcpDAO {

  constructor(execDir, client) {
    // this.aerospike = require(path.join(execDir, 'node_modules', 'mongodb'));
    this.client = client;
    this.vcpInfoCollection = 'vcp';
  }

  upsertVcp(vcpInfo, callback) {
    const queryObject = { '_id': vcpInfo.source };
    const newObject = {
      'stakes': vcpInfo.stakes
    };
    this.client.upsert(this.vcpInfoCollection, queryObject, newObject, callback);
  }

  getVcp(source, callback) {
    const queryObject = { '_id': source };
    this.client.findOne(this.vcpInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error, height);
        // callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND - ' + height));
      } else {
        var vcpInfo = {};
        vcpInfo.stakes = record.stakes;
        callback(error, vcpInfo);
      }
    })
  }

  getAllVcp(callback) {
    this.client.findAll(this.vcpInfoCollection, function (error, recordList) {
      if (error) {
        console.log('ERR - ', error, height);
        // callback(error);
      } else if (!recordList) {
        callback(Error('NOT_FOUND - ' + height));
      } else {
        var vcpInfoList = []
        for (var i = 0; i < recordList.length; i++) {
          var vcpInfo = {};
          vcpInfo.source = recordList[i]._id;
          vcpInfo.stakes = recordList[i].stakes;
          vcpInfoList.push(vcpInfo)
        }
        callback(error, vcpInfoList)
      }
    })
  }

  checkVcp(source, callback) {
    const queryObject = { '_id': source };
    return this.client.exist(this.vcpInfoCollection, queryObject, function (err, res) {
      if (err) {
        console.log('error in checkVcp: ', err);
        callback(err);
      }
      callback(err, res);
    });
  }
}