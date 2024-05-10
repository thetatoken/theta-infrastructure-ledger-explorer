import { apiService } from './api';

export const accountService = {
  getOneAccountByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`account/update/${address}`, {});
  },
  getTransactionHistory(address, startDate, endDate) {
    if (!address) {
      throw Error('Missing argument');
    }
    return apiService.get(`accountTx/history/${address}`, { params: { startDate, endDate } });
  },
  getTotalWallets(uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}account/total/number`, {})
    }
    return apiService.get(`account/total/number`, {})
  },
  getDailyActiveWallets(uri) {
    if (uri) {
      return apiService.getFullUri(`${uri}activeAccount/latest`, {})
    }
    return apiService.get(`activeAccount/latest`, {})
  }
};
