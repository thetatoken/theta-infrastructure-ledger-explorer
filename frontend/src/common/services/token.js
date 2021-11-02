import { apiService } from './api';

export const tokenService = {
  getTokenTxsByAddressAndTokenId(address, tokenId) {
    const uri = `token/${address}${tokenId == null ? `` : `?tokenId=${tokenId}`}`;
    return apiService.get(uri);
  },

  getTokenInfoByAddressAndTokenId(address, tokenId) {
    const uri = `tokenSummary/${address}${tokenId == null ? `` : `?tokenId=${tokenId}`}`;
    return apiService.get(uri);
  }
};
