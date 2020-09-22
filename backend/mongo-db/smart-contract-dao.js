//------------------------------------------------------------------------------
//  DAO for smartContract
//------------------------------------------------------------------------------

module.exports = class smartContractDAO {

  constructor(execDir, client) {
    this.client = client;
    this.smartContractInfoCollection = 'smartContract';
  }

  upsertSmartContract(smartContractInfo, callback) {
    // console.log('smartContractInfo in upsert:', smartContractInfo)
    const newObject = {
      'address': smartContractInfo.address,
      'bytecode': smartContractInfo.bytecode,
      'abi': smartContractInfo.abi,
      'source_code': smartContractInfo.source_code,
      'verification_date': smartContractInfo.verification_date,
      'compiler_version': smartContractInfo.compiler_version,
      'optimizer': smartContractInfo.optimizer
    }
    const queryObject = { '_id': smartContractInfo.address };
    this.client.upsert(this.smartContractInfoCollection, queryObject, newObject, callback);
  }

  getSmartContractByAddress(address, callback) {
    const queryObject = { '_id': address };
    this.client.findOne(this.smartContractInfoCollection, queryObject, function (error, record) {
      if (error) {
        console.log('ERR - SmartContract:', error);
        // callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND - SmartContract'));
      } else {
        delete record._id;
        callback(error, record)
      }
    })
  }
}