import { apiService } from './api';

export const stakeService = {
  getAllStake(types, uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}stake/all`, { params: { types } });
    }
    return apiService.get(`stake/all`, { params: { types } });
  },
  getTotalStake(type, uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}stake/totalAmount`, { params: { type } });
    }
    return apiService.get(`stake/totalAmount`, { params: { type } })
  },
  getSubStakes(types, uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}subStake/all`, { params: { types } });
    }
    return apiService.get(`subStake/all`, { params: { types } });
  },
  getTotalSubStake(type, uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}subStake/totalAmount`, { params: { type } });
    }
    return apiService.get(`subStake/totalAmount`, { params: { type } })
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
  getTotalTFuelStake() {
    return apiService.get(`stake/totalAmount`, { params: { type: 'tfuel' } })
  }
};
