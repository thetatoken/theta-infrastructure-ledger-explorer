import { apiService } from './api';

export const tokenService = {
  getTokenTxsByAddressAndTokenId(address, tokenId, page, limit) {
    const uri = `token/${address}?pageNumber=${page}&limit=${limit}${tokenId == null ? `` : `&tokenId=${tokenId}`}`;
    return apiService.get(uri);
  },

  getTokenInfoByAddressAndTokenId(address, tokenId) {
    const uri = `tokenSummary/${address}${tokenId == null ? `` : `?tokenId=${tokenId}`}`;
    return apiService.get(uri);
  }
};
