import { apiService } from './api';

export const priceService = {
  getAllprices() {
    return apiService.get(`price/all`, {});
  },
  getTfuelSupply() {
    return apiService.get(`supply/tfuel`, {});
  }
};
