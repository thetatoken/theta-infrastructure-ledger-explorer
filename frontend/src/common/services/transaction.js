import { apiService } from './api';

export const transactionsService = {
  getOneTransactionByUuid(uuid) {
    if (!uuid) {
      throw Error('Missing argument');
    }
    return apiService.get(`transaction/${uuid}`, {});
  },
  getTopTransactions() {
    return apiService.get(`transactions/range`, { params: { pageNumber: 0, limit: 10 } });
  },
  getTransactionsByPage(pageNumber, limit = 10) {
    return apiService.get('transactions/range', { params: { pageNumber, limit } });
  }
};
