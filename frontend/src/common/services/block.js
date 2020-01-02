import { apiService } from './api';

export const blocksService = {
  getBlockByHeight(blockHeight) {
    if (!blockHeight) {
      throw Error('Missing argument');
    }
    return apiService.get(`block/${blockHeight}`, {});
  },
  getTopBlocks() {
    return apiService.get(`blocks/top_blocks`);
  },
  getBlocksByPage(pageNumber, limit = 10) {
    return apiService.get('blocks/top_blocks', { params: { pageNumber, limit } });
  },
  getTotalBlockNumber(hour){
    return apiService.get(`blocks/number/${hour}`);
  },
};
