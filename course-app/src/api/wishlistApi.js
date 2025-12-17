import axiosClient from "./axiosClient";

const path = "/wishlist";

const getWishlist = () => {
  return axiosClient.get(path);
};

const addToWishlist = (courseId) => {
  return axiosClient.post(path, { courseId });
};

const removeFromWishlist = (courseId) => {
  return axiosClient.delete(`${path}/${courseId}`);
};

const clearWishlist = () => {
  return axiosClient.delete(path);
};

export const wishlistApi = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
};