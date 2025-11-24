import Course from './course.model.js';
import Review from '../review/review.model.js';
import Progress from '../progress/progress.model.js';

/**
 * Service: Lấy chi tiết khóa học
 * @param {string} slug - Slug của khóa học
 * @returns {Promise<object>} - Dữ liệu chi tiết của khóa học
 */
export const getCourseDetailsBySlug = async (slug) => {
  const course = await Course.findOne({ slug: slug, status: 'published' })
    .select(
      'title slug thumbnail previewUrl shortDescription topics includes ' +
      'audience description price priceDiscount level language requirements ' +
      'learnOutcomes instructor categories sections rating studentsCount ' +
      'totalLectures totalHours totalDurationSeconds status'
    )
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
        select: 'title duration isPreviewFree order videoUrl',
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

export const getAllCourses = async (query) => {
  const filter = { status: 'published' };

  if (query.category) {
  }

  const courses = await Course.find(filter)
    .select('title slug thumbnail price priceDiscount level rating reviewCount instructor categories')
    .populate('instructor', 'name avatar')
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  return courses;
};

export const getLearningDetails = async (slug, userId) => {
  const course = await Course.findOne({ slug })
    .select('title slug sections totalLectures')
    .populate({
      path: 'sections',
      select: 'title order',
      options: { sort: { order: 1 } },
      populate: {
        path: 'lectures',
        model: 'Lecture',
        select: 'title videoUrl duration isPreviewFree order resources', 
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!course) {
    const error = new Error('Không tìm thấy khóa học.');
    error.statusCode = 404;
    throw error;
  }

  let progress = await Progress.findOne({ student: userId, course: course._id });
  
  if (!progress) {
    progress = {
      student: userId,
      course: course._id,
      completedLectures: [],
      percentage: 0
    };
  }

  return {
    course,
    progress
  };
};
