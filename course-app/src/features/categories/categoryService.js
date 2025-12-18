import { categoryApi } from '../../api/categoryApi';

const getAllCategories = async (params) => {
  const response = await categoryApi.getAllCategories(params);
  return response.data;
};

const getAllCategoriesSimple = async () => {
  const response = await categoryApi.getAllCategoriesSimple();
  return response.data.data; // chỉ trả về mảng category
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
  getAllCategoriesSimple, 
  createCategory,
  updateCategory,
  deleteCategory
};

export default categoryService;