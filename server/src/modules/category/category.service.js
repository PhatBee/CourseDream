import Category from './category.model.js';

export const getAllCategories = async () => {
  const categories = await Category.find().select('name slug icon').lean();
  return categories;
};