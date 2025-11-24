import Category from './category.model.js';
import Course from '../course/course.model.js';

export const getAllCategories = async () => {
  const categories = await Category.find().lean();

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Course.countDocuments({ 
        categories: cat._id, 
        status: 'published'
      });

      return {
        ...cat,
        courseCount: count
      };
    })
  );

  return categoriesWithCount;
};