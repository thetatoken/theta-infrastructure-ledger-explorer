var path = require('path');
//------------------------------------------------------------------------------
//  DAO for check point
//------------------------------------------------------------------------------

module.exports = class stakeDAO {

  constructor(execDir, client) {
    this.client = client;
    this.checkpointInfoCollection = 'checkpoint';
  }

  insert(checkpointInfo, callback) {
    this.client.insert(this.checkpointInfoCollection, checkpointInfo, callback);
  }

}