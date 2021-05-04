//------------------------------------------------------------------------------
//  DAO for daily account
//------------------------------------------------------------------------------

module.exports = class DailyAccountDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'dailyAct';
  }

  insert(info, callback) {
    const object = { '_id': info.address };
    this.client.insert(this.collection, object, callback);
  }
  checkAccount(address, callback) {
    const queryObject = { '_id': address };
    return this.client.exist(this.collection, queryObject, function (err, res) {
      if (err) {
        console.log('error in checkAccount: ', err);
        callback(err);
      }
      callback(err, res);
    });
  }
  getTotalNumber(callback) {
    this.client.getTotal(this.collection, null, function (error, record) {
      if (error) {
        console.log('Daily Account dao getTotalNumber ERR - ', error);
        callback(error);
      } else {
        callback(error, record);
      }
    });
  }
  removeAll(callback) {
    this.client.remove(this.collection, function (err, res) {
      if (err) {
        console.log('Daily Account dao removeAll ERR - ', err);
        callback(err);
      }
      callback(err, res);
    })
  }
}