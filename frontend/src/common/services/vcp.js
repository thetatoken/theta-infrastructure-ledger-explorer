import { apiService } from './api';

export const vcpService = {
  getAllVcp() {
    return apiService.get(`vcp/all`, {});
  },
  getVcpByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`vcp/${address}`, {});
  }
};
