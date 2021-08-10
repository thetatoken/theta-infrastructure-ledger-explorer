import { apiService } from './api';

export const rewardDistributionService = {
  getRewardDistributionByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`rewardDistribution/${address}`, {});
  },
  getAllRewardDistribution() {
    return apiService.get(`rewardDistribution/all`, {})
  }
};
