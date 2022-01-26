import { apiService } from './api';

export const tokenService = {
  getTokenTxsByAddressAndTokenId(address, tokenId, page, limit) {
    const uri = `token/${address}?pageNumber=${page}&limit=${limit}${tokenId == null ? `` : `&tokenId=${tokenId}`}`;
    return apiService.get(uri);
  },

  getTokenInfoByAddressList(addressList) {
    const uri = `tokenSummaries?addressList=${JSON.stringify(addressList)}`;
    return apiService.get(uri);
  },

  getTokenInfoByAddressAndTokenId(address, tokenId) {
    const uri = `tokenSummary/${address}${tokenId == null ? `` : `?tokenId=${tokenId}`}`;
    return apiService.get(uri);
  },

  getTokenTxsByAccountAndType(address, type, page, limit) {
    const uri = `account/tokenTx/${address}?type=${type}&pageNumber=${page}&limit=${limit}`;
    return apiService.get(uri);
  },

  getTokenTxsNumByAccountAndType(address, type) {
    const uri = `account/tokenTxNum/${address}?type=${type}`;
    return apiService.get(uri);
  },

  getHoldersByAccountAndTokenId(address, tokenId) {
    const uri = `tokenHolder/${address}${tokenId == null ? `` : `?tokenId=${tokenId}`}`;
    return apiService.get(uri);
  }
};
