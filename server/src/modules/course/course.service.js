import Course from './course.model.js';
import Review from '../review/review.model.js';
import Progress from '../progress/progress.model.js';
import Lecture from "./lecture.model.js";
import Section from "./section.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Category from '../category/category.model.js';
import { uploadToYouTube } from '../../config/youtube.js';
import { uploadToCloudinary } from '../../config/cloudinary.js';
import slugify from 'slugify';
import mongoose from 'mongoose';
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
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 9;
  const skip = (page - 1) * limit;

  const filter = { status: 'published' };
  if (query.category) {
  }

  const courses = await Course.find(filter)
    .select('title slug thumbnail price priceDiscount level rating reviewCount instructor categories')
    .populate('instructor', 'name avatar')
    .populate('categories', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalCourses = await Course.countDocuments(filter);
  const totalPages = Math.ceil(totalCourses / limit);

  return {
    courses,
    pagination: {
      total: totalCourses,
      page,
      limit,
      totalPages
    }
  };
};

export const getLearningDetails = async (slug, userId) => {
  const course = await Course.findOne({ slug })
    .select('title slug sections totalLectures thumbnail instructor')
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
    .populate('instructor', 'name avatar')
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

/**
 * Upload video lên YouTube (Service riêng để gọi từ Controller)
 */
export const uploadVideo = async (file, title) => {
  return await uploadToYouTube(file.buffer, title, "Uploaded via DreamsLMS");
};

// Hàm helper để chuẩn hóa input mảng từ FormData
// Vì FormData gửi 1 item sẽ là string, gửi nhiều là array. Chúng ta cần ép về Array.
const parseArrayField = (fieldData) => {
  if (!fieldData) return [];
  if (Array.isArray(fieldData)) return fieldData;
  return [fieldData];
};

/**
 * Tạo khóa học mới (Bao gồm Sections và Lectures)
 */
export const createCourse = async (courseData, thumbnailFile, instructorId) => {
  // Logic Validation: Nếu KHÔNG phải Draft thì mới bắt buộc validate kỹ
  const isDraft = courseData.status === 'draft' || courseData.status === 'hidden';

  // Các field khác nếu thiếu khi Submit (Pending) thì Frontend đã chặn rồi.
  // Backend chỉ cần đảm bảo không crash.

  // 1. Xử lý Thumbnail
  let thumbnailUrl = '';
  if (thumbnailFile) {
    const uploadResult = await uploadToCloudinary(thumbnailFile.buffer, 'dreamcourse/thumbnails');
    thumbnailUrl = uploadResult.secure_url;
  }

  // 2. Tạo Slug unique
  const baseSlug = slugify(courseData.title, { lower: true, strict: true });
  const slug = `${baseSlug}-${Date.now()}`;

  // 3. Xử lý Category (Chọn có sẵn hoặc Tạo mới)
  // Lấy mảng input từ FormData (có thể là ID hoặc Tên mới)
  const rawCategories = parseArrayField(courseData.categories);
  const finalCategoryIds = [];

  for (const catInput of rawCategories) {
    // Nếu là ObjectId hợp lệ -> Đã có trong DB -> Push luôn
    if (mongoose.Types.ObjectId.isValid(catInput)) {
      finalCategoryIds.push(catInput);
    } else {
      // Nếu không phải ID -> Là tên Category mới -> Tìm hoặc Tạo
      let existingCat = await Category.findOne({ name: catInput });

      if (existingCat) {
        finalCategoryIds.push(existingCat._id);
      } else {
        // Tạo mới
        const newCatSlug = slugify(catInput, { lower: true, strict: true });
        const newCategory = await Category.create({
          name: catInput,
          slug: newCatSlug
        });
        finalCategoryIds.push(newCategory._id);
      }
    }
  }

  // 4. Chuẩn hóa các trường mảng (Do FormData gửi lên có thể nhập nhằng)
  const learnOutcomes = parseArrayField(courseData.learnOutcomes);
  const requirements = parseArrayField(courseData.requirements);
  const audience = parseArrayField(courseData.audience);
  const includes = parseArrayField(courseData.includes);
  const resources = parseArrayField(courseData.resources);

  // 5. Tạo Course (Draft trước)
  const newCourse = new Course({
    title: courseData.title,
    slug: slug,
    thumbnail: thumbnailUrl,
    previewUrl: courseData.previewUrl || '', // URL Youtube đã upload từ Frontend

    shortDescription: courseData.shortDescription,
    description: courseData.description,

    price: Number(courseData.price) || 0,
    priceDiscount: Number(courseData.priceDiscount) || 0,

    level: courseData.level || 'alllevels',
    language: courseData.language || 'Vietnamese',

    // Mảng String
    learnOutcomes,
    requirements,
    audience,
    includes,
    resources,

    // Relations
    instructor: instructorId,
    // Lưu ý: courseData.category gửi lên là ID dạng chuỗi
    categories: finalCategoryIds,

    sections: [],
    // Nếu user chọn Submit -> status = 'pending'
    // Nếu user chọn Save Draft -> status = 'draft' hoặc 'hidden' (do frontend gửi lên)
    status: courseData.status || 'draft',

    // Init stats
    totalLectures: 0,
    totalDurationSeconds: 0,
    totalHours: 0,
    totalStudents: 0,
    rating: 0
  });

  const savedCourse = await newCourse.save();

  // 6. Xử lý Sections và Lectures (Nếu có gửi kèm)
  // courseData.sections là chuỗi JSON từ formData, cần parse
  let sectionsData = [];
  try {
    // Frontend gửi JSON string cho cấu trúc phức tạp này
    sectionsData = JSON.parse(courseData.sections || '[]');
  } catch (e) {
    console.error("Error parsing sections JSON:", e);
  }

  const sectionIds = [];

  // Biến để tính toán tổng
  let calculatedTotalLectures = 0;
  let calculatedTotalDuration = 0;

  for (const sectionData of sectionsData) {
    // Tạo Lecture docs
    const lectureIds = [];
    if (sectionData.lectures && sectionData.lectures.length > 0) {
      for (const lecData of sectionData.lectures) {
        const duration = Number(lecData.duration) || 0;

        const newLecture = await Lecture.create({
          title: lecData.title,
          videoUrl: lecData.videoUrl, // URL đã có từ bước upload trước
          duration: Number(lecData.duration) || 0,
          isPreviewFree: lecData.isPreviewFree,
          order: lecData.order || 0,
          // resources...
        });
        lectureIds.push(newLecture._id);

        // Cộng dồn thống kê
        calculatedTotalLectures++;
        calculatedTotalDuration += duration; // giây
      }
    }

    // Tạo Section doc
    const newSection = await Section.create({
      title: sectionData.title,
      course: savedCourse._id,
      lectures: lectureIds,
      order: sectionData.order || 0 // Bạn nên handle order ở frontend
    });

    // Cập nhật section vào lecture (để reference ngược lại nếu cần)
    await Lecture.updateMany(
      { _id: { $in: lectureIds } },
      { $set: { section: newSection._id } }
    );

    sectionIds.push(newSection._id);
  }

  // 7. Update Course
  savedCourse.sections = sectionIds;
  savedCourse.totalStudents = 0;
  savedCourse.rating = 0;
  savedCourse.totalLectures = calculatedTotalLectures;
  savedCourse.totalDurationSeconds = calculatedTotalDuration;
  savedCourse.totalHours = parseFloat((calculatedTotalDuration / 3600).toFixed(1)); // Đổi ra giờ, lấy 1 số lẻ

  await savedCourse.save();

  return savedCourse;
};

/**
 * Lấy danh sách khóa học của Instructor (có phân trang & lọc)
 */
export const getInstructorCourses = async (instructorId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 9;
  const skip = (page - 1) * limit;
  const status = query.status; // 'published', 'pending', 'draft', 'hidden'

  const filter = { instructor: instructorId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  const courses = await Course.find(filter)
    .select('title slug thumbnail price priceDiscount level rating studentsCount status totalLectures totalHours')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalCourses = await Course.countDocuments(filter);

  // Tính thống kê cho Dashboard
  // (Có thể tách ra API riêng nếu nặng, nhưng làm chung cho tiện)
  const stats = await Course.aggregate([
    { $match: { instructor: new mongoose.Types.ObjectId(instructorId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  // Format stats về dạng object { published: 10, draft: 5... }
  const statsObj = { all: 0, published: 0, pending: 0, draft: 0, hidden: 0 };
  stats.forEach(s => {
    if (statsObj.hasOwnProperty(s._id)) {
      statsObj[s._id] = s.count;
    }
    statsObj.all += s.count;
  });

  return {
    courses,
    stats: statsObj,
    pagination: {
      total: totalCourses,
      page,
      limit,
      totalPages: Math.ceil(totalCourses / limit)
    }
  };
};