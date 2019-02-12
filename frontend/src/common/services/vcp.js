import { apiService } from './api';

export const vcpService = {
  getAllVcp() {
    return apiService.get(`vcp/all`, {});
  }
};
