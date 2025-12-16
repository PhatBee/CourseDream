import Category from './category.model.js';
import Course from '../course/course.model.js';
import slugify from 'slugify';

export const getAllCategories = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || '';
  const sortBy = query.sortBy || 'name';
  const order = query.order === 'desc' ? -1 : 1;
  const skip = (page - 1) * limit;

  const filter = {};
  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  let categories = await Category.find(filter)
    .lean();

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Course.countDocuments({
        categories: cat._id,
        status: { $in: ['published'] }
      });
      return { ...cat, courseCount: count };
    })
  );

  categoriesWithCount.sort((a, b) => {
    if (sortBy === 'courseCount') return (a.courseCount - b.courseCount) * order;
    return a.name.localeCompare(b.name) * order;
  });

  const total = categoriesWithCount.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = categoriesWithCount.slice(skip, skip + limit);

  return {
    data: paginatedData,
    pagination: { total, page, limit, totalPages }
  };
};

export const createCategory = async (data) => {
  const { name, icon, description } = data;

  const slug = slugify(name, { lower: true, strict: true });

  const exist = await Category.findOne({ slug });
  if (exist) throw new Error('Category này đã tồn tại.');

  const category = await Category.create({ name, slug, icon, description });
  return category;
};

export const updateCategory = async (id, data) => {
  const { name, icon, description } = data;
  const updateFields = { icon, description };

  if (name) {
    updateFields.name = name;
    updateFields.slug = slugify(name, { lower: true, strict: true });
  }

  const category = await Category.findByIdAndUpdate(id, updateFields, { new: true });
  if (!category) throw new Error('Category không tồn tại.');

  return category;
};

export const deleteCategory = async (id) => {
  const count = await Course.countDocuments({ categories: id });

  if (count > 0) {
    const error = new Error(`Không thể xóa! Do có khóa học thuộc thể loại này.`);
    error.statusCode = 400;
    throw error;
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new Error('Category không tồn tại.');

  return { message: 'Đã xóa Category thành công.' };
};

// Get all categories without pagination (for dropdowns)
export const getAllCategoriesSimple = async () => {
  const categories = await Category.find({})
    .select('_id name slug icon')
    .sort({ name: 1 })
    .lean();

  return categories;
};