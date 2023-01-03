import { apiService } from './api';

export const priceService = {
  getAllprices() {
    return apiService.get(`price/all`, {});
  },
  getTfuelSupply(uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}supply/tfuel`, {});
    }
    return apiService.get(`supply/tfuel`, {});
  }
};
