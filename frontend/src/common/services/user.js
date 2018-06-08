import { apiService } from './api';
const res = {
  data: {
    body: {
      address: 'some address',
      balance: 'many'
    },
    type: 'user'
  }
}
export const userService = {
  getOneUserByAddress(address) {
    if (!address) {
      throw Error('Missing argument');
    }
    // return apiService.get(`user/${address}`, {});
    return Promise.resolve(res);
  }
};
