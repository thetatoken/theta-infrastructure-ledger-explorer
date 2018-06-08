import { apiService } from './api';

export const userService = {
  getOneUserByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    // return apiService.get(`user/${address}`, {});
    const res = {
      data: {
        body: {
          address,
          balance: 'many'
        },
        type: 'user'
      }
    }
    return Promise.resolve(res);
  }
};
