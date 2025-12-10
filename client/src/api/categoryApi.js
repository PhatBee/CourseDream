import axiosClient from "./axiosClient";

const path = "/categories";

const getAllCategories = (params) => {
  return axiosClient.get(path, { params });
};

const getAllCategoriesSimple = () => {
  return axiosClient.get(`${path}/all`);
};

const createCategory = (data) => {
  return axiosClient.post(path, data);
};

const updateCategory = (id, data) => {
  return axiosClient.put(`${path}/${id}`, data);
};

const deleteCategory = (id) => {
  return axiosClient.delete(`${path}/${id}`);
};

export const categoryApi = {
  getAllCategories,
  getAllCategoriesSimple,
  createCategory,
  updateCategory,
  deleteCategory
};