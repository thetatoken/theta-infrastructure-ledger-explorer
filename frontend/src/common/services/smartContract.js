import { apiService } from './api';

export const smartContractService = {
  getOneByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`smartcontract/${address}`, {});
  },
  verifySourceCode(address, sourceCode, abi, version, versionFullName, optimizer) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`smartcontract/verify/${address}`, { params: { sourceCode, abi, version, versionFullName, optimizer } });
  }
};
