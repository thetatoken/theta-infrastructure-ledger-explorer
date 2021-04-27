import { apiService } from './api';

export const stakeService = {
  getAllStake(types) {
    return apiService.get(`stake/all`, { params: { types } });
  },
  getTotalStake() {
    return apiService.get(`stake/totalAmount`, {})
  },
  getStakeByAddress(address, types = ['vcp', 'gcp', 'eenp']) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`stake/${address}`, { params: { types } });
  },
  getStakeReturnTime(height) {
    return apiService.get(`stake/returnTime`, { params: { return_height: height } })
  },
  //TODO: remove after merge 3.0 brannch
  getPreEdgeNodeTfuel() {
    return apiService.get(`stake/totalAmount/tfuel`, {})
  }
};
