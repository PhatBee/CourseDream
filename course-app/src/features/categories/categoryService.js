import { categoryApi } from '../../api/categoryApi';

const getAllCategories = async (params) => {
  const response = await categoryApi.getAllCategories(params);
  return response.data;
};

const createCategory = async (data) => {
  const response = await categoryApi.createCategory(data);
  return response.data;
};

const updateCategory = async (id, data) => {
  const response = await categoryApi.updateCategory(id, data);
  return response.data;
};

const deleteCategory = async (id) => {
  const response = await categoryApi.deleteCategory(id);
  return response.data;
};

const categoryService = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};

export default categoryService;