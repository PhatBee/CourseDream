import Course from './course.model.js';
import Review from '../review/review.model.js';
import Progress from '../progress/progress.model.js';
import Lecture from "./lecture.model.js";
import Section from "./section.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
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
export const searchCourses = async (query) => {
  const q = (query.q || "").trim();
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "12", 10);
  const skip = (page - 1) * limit;

  const filter = q ? {
    $or: [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
    ]
  } : {};

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .skip(skip)
      .limit(limit)
      .select("title slug thumbnail price rating studentsCount")
      .sort({ rating: -1, createdAt: -1 })
  ]);

  return { total, page, limit, courses };
};

export const getLecture = async ({ courseId, lectureId, user }) => {
  const lecture = await Lecture.findById(lectureId).populate("section");
  if (!lecture) return { error: { status: 404, message: "Bài giảng không tồn tại" } };

  const section = lecture.section ? lecture.section : await Section.findById(lecture.section);
  if (!section || section.course.toString() !== courseId.toString()) {
    return { error: { status: 400, message: "Lecture không thuộc khóa học này" } };
  }

  if (lecture.isPreviewFree) return { lecture };

  if (!user) return { error: { status: 401, message: "Vui lòng đăng nhập để xem bài giảng" } };

  const enrolled = await Enrollment.findOne({ student: user._id, course: courseId });
  if (!enrolled) return { error: { status: 403, message: "Bạn chưa mua khóa học này" } };

  return { lecture };
};