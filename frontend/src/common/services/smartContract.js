import { apiService } from './api';

export const smartContractService = {
  getOneByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`smartcontract/${address}`, {});
  },
  verifySourceCode(address, byteCode, sourceCode, abi, version, optimizer) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`smartcontract/verify/${address}`, { params: { byteCode, sourceCode, abi, version, optimizer } });
  }
};
