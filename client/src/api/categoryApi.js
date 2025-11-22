import axiosClient from "./axiosClient";

const path = "/categories";

const getAllCategories = () => {
  return axiosClient.get(path);
};

export const categoryApi = {
  getAllCategories,
};