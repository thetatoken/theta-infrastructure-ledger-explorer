import { apiService } from './api';
import { TxnTypes } from 'common/constants';

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
  },

  getTransactionsByAddress(address, pageNumber = 1, limitNumber = 50) {
    let isEqualType = false;
    // let type = TxnTypes.SERVICE_PAYMENT; //Exclude this
    let type = 10; //Return all types
    return apiService.get(`accounttx/${address}`, { params: { type, pageNumber, limitNumber, isEqualType } });
  }
};
