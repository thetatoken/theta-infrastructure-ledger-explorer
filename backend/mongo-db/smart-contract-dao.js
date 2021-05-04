//------------------------------------------------------------------------------
//  DAO for smartContract
//------------------------------------------------------------------------------

module.exports = class smartContractDAO {

  constructor(execDir, client) {
    this.client = client;
    this.collection = 'smartContract';
  }

  upsertSmartContract(smartContractInfo, callback) {
    const newObject = {
      'address': smartContractInfo.address,
      'bytecode': smartContractInfo.bytecode,
      'abi': smartContractInfo.abi,
      'source_code': smartContractInfo.source_code,
      'verification_date': smartContractInfo.verification_date,
      'compiler_version': smartContractInfo.compiler_version,
      'optimizer': smartContractInfo.optimizer,
      'name': smartContractInfo.name,
      'function_hash': smartContractInfo.function_hash,
      'constructor_arguments': smartContractInfo.constructor_arguments
    }
    const queryObject = { '_id': smartContractInfo.address };
    this.client.upsert(this.collection, queryObject, newObject, callback);
  }

  getSmartContractByAddress(address, callback) {
    const queryObject = { '_id': address };
    this.client.findOne(this.collection, queryObject, function (error, record) {
      if (error) {
        console.log('Smart Contract dao getSmartContractByAddress ERR - ', error);
        callback(error);
      } else if (!record) {
        callback(Error('NOT_FOUND - SmartContract'));
      } else {
        delete record._id;
        callback(error, record)
      }
    })
  }

  checkSmartContract(address, callback) {
    const queryObject = { '_id': address };
    return this.client.exist(this.collection, queryObject, function (err, res) {
      if (err) {
        console.log('error in check SmartContract: ', err);
        callback(err);
      }
      callback(err, res);
    });
  }

  getAbi(address, callback){
    const queryObject = { '_id': address };
    let projectionObject = { abi: 1, _id: 0 };
    this.client.queryWithProjection(this.collection, queryObject, projectionObject, callback);
  }
}