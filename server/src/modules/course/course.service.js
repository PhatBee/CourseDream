import Course from './course.model.js';
import Review from '../review/review.model.js';

/**
 * Service: Lấy chi tiết khóa học
 * @param {string} slug - Slug của khóa học
 * @returns {Promise<object>} - Dữ liệu chi tiết của khóa học
 */
export const getCourseDetailsBySlug = async (slug) => {
  const course = await Course.findOne({ slug: slug, status: 'published' })
    .populate({
      path: 'instructor',
      select: 'name avatar bio skills',
    })
    .populate({
      path: 'categories',
      select: 'name slug',
    })
    .populate({
      path: 'sections',
      select: 'title order',
      options: { sort: { order: 1 } },
      populate: {
        path: 'lectures',
        model: 'Lecture',
        select: 'title duration isPreviewFree order',
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!course) {
    const error = new Error('Không tìm thấy khóa học.');
    error.statusCode = 404;
    throw error;
  }

  const reviews = await Review.find({ course: course._id })
    .populate({
      path: 'student',
      select: 'name avatar',
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const reviewCount = await Review.countDocuments({ course: course._id });

  return {
    course,
    reviews,
    reviewCount,
  };
};