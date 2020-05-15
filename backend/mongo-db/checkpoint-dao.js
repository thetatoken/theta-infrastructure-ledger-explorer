//------------------------------------------------------------------------------
//  DAO for check point
//  Require index: `db.checkpoint.createIndex({height:-1})`
//------------------------------------------------------------------------------

module.exports = class checkpointDAO {

  constructor(execDir, client) {
    this.client = client;
    this.checkpointInfoCollection = 'checkpoint';
  }

  insert(checkpointInfo, callback) {
    this.client.insert(this.checkpointInfoCollection, checkpointInfo, callback);
  }

  getCheckpointByHeight(height, callback) {
    const queryObject = { 'height': height };
    this.client.findOne(this.checkpointInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - ', error, height);
        // callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND - ' + height));
      } else {
        // console.log('check point info in record: ', record)
        var checkpointInfo = {};
        checkpointInfo.height = record.height;
        checkpointInfo.hash = record.hash;
        checkpointInfo.guardians = record.guardians;
        callback(error, checkpointInfo);
      }
    })
  }
}