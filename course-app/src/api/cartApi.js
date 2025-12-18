import axiosClient from './axiosClient';
const path = '/cart';

const cartApi = {
  getCart: () => axiosClient.get(path),
  addToCart: (courseId) => axiosClient.post(`${path}/add`, { courseId }),
  removeFromCart: (courseId) => axiosClient.delete(`${path}/remove/${courseId}`),
  clearCart: () => axiosClient.delete(`${path}/clear`),
};

export default cartApi;