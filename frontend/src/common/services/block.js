import { apiService } from './api';

export const blocksService = {
  getBlockByHeight({ blockHeight }) {
    if (!blockHeight) {
      throw Error('Missing argument');
    }
    return apiService.get(`block/${blockHeight}`, {});
  },
  getTopBlocks() {
    return apiService.get(`blocks/top_blocks`);
  },
};
