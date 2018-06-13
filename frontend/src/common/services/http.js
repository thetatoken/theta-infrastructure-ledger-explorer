import axios from 'axios';

axios.defaults.timeout = 50000;

export const httpClient = {
  get(url, config = {}) {
    if (!url) throw new Error('Missing URL');
    return axios.get(url, config);
  },
  delete(url, config = {}) {
    if (!url) throw new Error('Missing URL');
    return axios.delete(url, config);
  },
  post(url, data = {}, config = {}) {
    if (!url) throw new Error('Missing URL');
    return axios.post(url, data, config);
  },
  put(url, data = {}, config = {}) {
    if (!url) throw new Error('Missing URL');
    return axios.put(url, data, config);
  },
};
