import Course from './course.model.js';
import CourseRevision from './courseRevision.model.js';
import Review from '../review/review.model.js';
import Progress from '../progress/progress.model.js';
import Lecture from "./lecture.model.js";
import Section from "./section.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Category from "../category/category.model.js";
import InstructorProfile from "../user/InstructorProfile.model.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import slugify from "slugify";
import mongoose from "mongoose";
import notificationService from "../notification/notification.service.js";
import User from "../auth/auth.model.js";
import { signThumbnailUrl } from '../../config/aws.js';
// NOTE: Video uploads now go directly to S3 via presigned URLs from the frontend.
// This service no longer handles video file uploads.
/**
 * Service: Lấy chi tiết khóa học
 * @param {string} slug - Slug của khóa học
 * @returns {Promise<object>} - Dữ liệu chi tiết của khóa học
 */
export const getCourseDetailsBySlug = async (slug, currentUser) => {
  const course = await Course.findOne({ slug: slug })
    .select(
      "title slug thumbnail previewUrl shortDescription topics includes " +
      "audience description price priceDiscount level language requirements " +
      "learnOutcomes instructor categories sections rating studentsCount " +
      "totalLectures totalHours totalDurationSeconds status"
    )
    .populate({
      path: "instructor",
      select: "name avatar bio skills",
    })
    .populate({
      path: "categories",
      select: "name slug",
    })
    .populate({
      path: "sections",
      select: "title order",
      options: { sort: { order: 1 } },
      populate: {
        path: "lectures",
        model: "Lecture",
        select: "title duration isPreviewFree order videoUrl",
        options: { sort: { order: 1 } },
      },
    })
    .lean();

  if (!course) {
    const error = new Error("Không tìm thấy khóa học.");
    error.statusCode = 404;
    throw error;
  }

  // Kiểm tra trạng thái khóa học
  if (course.status !== 'published') {
    const isAuthorized = currentUser && (
      currentUser.role === 'admin' ||
      String(currentUser._id) === String(course.instructor)
    );

    if (!isAuthorized) {
      const error = new Error("Khóa học này hiện đã bị tạm ẩn.");
      error.statusCode = 403;
      error.code = "COURSE_TEMPORARILY_HIDDEN";
      throw error;
    }
  }

  // [MỚI] Lấy thông tin chi tiết Instructor Profile
  if (course.instructor) {
    const instructorDetails = await InstructorProfile.findOne({ user: course.instructor._id }).lean();

    // Merge thông tin vào object instructor
    if (instructorDetails) {
      course.instructor = {
        ...course.instructor, // name, avatar, bio (user)
        headline: instructorDetails.headline,
        experience: instructorDetails.experience,
        education: instructorDetails.education,
        specialties: instructorDetails.specialties,
        socialLinks: instructorDetails.socialLinks,
        totalStudents: instructorDetails.totalStudents,
        totalReviews: instructorDetails.totalReviews,
        rating: instructorDetails.rating
      };
    }
  }

  const reviews = await Review.find({ course: course._id })
    .populate({
      path: "student",
      select: "name avatar",
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const reviewCount = await Review.countDocuments({ course: course._id });

  if (course && course.thumbnail) {
    course.thumbnail = signThumbnailUrl(course.thumbnail);
  }

  return {
    course,
    reviews,
    reviewCount,
  };
};

export const getPopularCourses = async () => {

  const courses = await Course.find({ status: 'published' })
    .sort({ studentsCount: -1, rating: -1 })
    .limit(5)
    .select(
      "title slug thumbnail price priceDiscount level rating reviewCount instructor categories"
    )
    .populate("instructor", "name avatar")
    .populate("categories", "name")
    .lean();

  courses.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  return courses;
};

export const getAllCourses = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 9;
  const skip = (page - 1) * limit;

  const filter = { status: "published" };
  if (query.category) {
    filter.categories = { $in: Array.isArray(query.category) ? query.category : [query.category] };
  }

  if (query.search) {
    filter.title = { $regex: query.search, $options: 'i' };
  }

  const courses = await Course.find(filter)
    .select(
      "title slug thumbnail price priceDiscount level rating instructor categories"
    )
    .populate("instructor", "name avatar")
    .populate("categories", "name slug")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Thêm reviewCount cho mỗi course
  const coursesWithReviewCount = await Promise.all(
    courses.map(async (course) => {
      const reviewCount = await Review.countDocuments({ course: course._id });
      course.reviewCount = reviewCount;
      return course;
    })
  );

  coursesWithReviewCount.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  const totalCourses = await Course.countDocuments(filter);
  const totalPages = Math.ceil(totalCourses / limit);

  return {
    courses: coursesWithReviewCount,
    pagination: {
      total: totalCourses,
      page,
      limit,
      totalPages,
    },
  };
};

export const getLearningDetails = async (slug, userId) => {
  const course = await Course.findOne({ slug })
    .select("title slug sections totalLectures thumbnail instructor shortDescription description")
    .populate({
      path: "sections",
      select: "title order",
      options: { sort: { order: 1 } },
      populate: {
        path: "lectures",
        model: "Lecture",
        // ✅ FIX: Thêm quizzes vào select — student cần nhận quizzes khi học
        // correctAnswer được lọc phía client (chỉ FE nhận timestamp, question, options, hint)
        select: "title videoUrl duration isPreviewFree order resources quizzes",
        options: { sort: { order: 1 } },
      },
    })
    .populate("instructor", "name avatar")
    .lean();

  if (!course) {
    const error = new Error("Không tìm thấy khóa học.");
    error.statusCode = 404;
    throw error;
  }

  // ✅ SECURITY: Strip correctAnswer khỏi quizzes trước khi gửi cho student
  // correctAnswer chỉ được kiểm tra phía server qua POST /quiz-answer
  if (course.sections) {
    course.sections = course.sections.map(sec => ({
      ...sec,
      lectures: (sec.lectures || []).map(lec => {
        let signedResources = [];
        if (lec.resources) {
          signedResources = lec.resources.map(res => {
            if (res.url && res.url.includes('cloudfront.net')) {
              return { ...res, url: signThumbnailUrl(res.url) };
            }
            return res;
          });
        }
        return {
          ...lec,
          resources: signedResources,
          quizzes: (lec.quizzes || []).map(({ correctAnswer, ...safeQuiz }) => safeQuiz)
        };
      })
    }));
  }

  const enrolled = await Enrollment.findOne({
    student: userId,
    course: course._id,
  });

  const isInstructorOrAdmin = userId && (
    userId.toString() === String(course.instructor?._id || course.instructor) ||
    await User.exists({ _id: userId, role: "admin" })
  );

  if (!isInstructorOrAdmin) {
    if (!enrolled) {
      const error = new Error("Bạn chưa mua khóa học này.");
      error.statusCode = 403;
      throw error;
    }
    if (!enrolled.isActivated) {
      const error = new Error("Khóa học chưa được kích hoạt.");
      error.statusCode = 403;
      throw error;
    }
    if (enrolled.endedAt && enrolled.endedAt < new Date()) {
      const error = new Error("Khóa học đã hết thời hạn sử dụng.");
      error.statusCode = 403;
      throw error;
    }
  }

  await Enrollment.findOneAndUpdate(
    { student: userId, course: course._id },
    { lastViewedAt: new Date() }
  );

  let progress = await Progress.findOne({
    student: userId,
    course: course._id,
  });

  if (!progress) {
    progress = {
      student: userId,
      course: course._id,
      completedLectures: [],
      percentage: 0,
      completedQuizzes: [],
    };
  }

  if (course && course.thumbnail) {
    course.thumbnail = signThumbnailUrl(course.thumbnail);
  }

  return {
    course,
    progress,
  };
};

// Escape ký tự đặc biệt trong regex để tránh lỗi
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Bảo đảm giá trị là mảng
const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

// Check ObjectId hợp lệ
const toObjectIdArray = (arr) => {
  return arr
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));
};

export const searchCourses = async (query) => {
  try {
    const q = (query.q || "").trim();
    const safeQ = escapeRegex(q);

    const page = parseInt(query.page || "1", 10);
    const limit = parseInt(query.limit || "12", 10);
    const skip = (page - 1) * limit;

    const filter = { status: "published" };

    // 1. Search
    if (q) {
      filter.$or = [
        { title: { $regex: safeQ, $options: "i" } },
        { description: { $regex: safeQ, $options: "i" } },
      ];
    }

    // 2. Filter categories
    const categories = toObjectIdArray(toArray(query.category));
    if (categories.length > 0) {
      filter.categories = { $in: categories };
    }

    // 3. Filter instructor
    const instructors = toObjectIdArray(toArray(query.instructor));
    if (instructors.length > 0) {
      filter.instructor = { $in: instructors };
    }

    // 4. Filter price
    const prices = toArray(query.price).filter(Boolean);

    if (prices.length > 0) {
      if (prices.includes("free") && prices.includes("paid")) {
        // Không filter gì cả
      } else if (prices.includes("free")) {
        filter.$or = [
          { price: 0 },
          { price: { $exists: false } }, // Khóa học không có price → xem như free
        ];
      } else if (prices.includes("paid")) {
        filter.price = { $gt: 0 };
      }
    }

    // 5. Filter level
    const levels = toArray(query.level).filter(Boolean);
    if (levels.length > 0) {
      filter.level = { $in: levels };
    }

    // Debug filter
    console.log("Final Filter:", JSON.stringify(filter, null, 2));

    // 6. Query DB
    const [total, courses] = await Promise.all([
      Course.countDocuments(filter),

      Course.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select(
          "title slug thumbnail price priceDiscount level rating studentsCount instructor categories"
        )
        .populate("instructor", "name avatar")
        .populate("categories", "name slug")
        .lean(),
    ]);

    // Thêm reviewCount cho mỗi course
    const coursesWithReviewCount = await Promise.all(
      courses.map(async (course) => {
        const reviewCount = await Review.countDocuments({ course: course._id });
        course.reviewCount = reviewCount ? reviewCount : 0;
        return course;
      })
    );

    coursesWithReviewCount.forEach(c => {
      if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
    });

    return { total, page, limit, courses: coursesWithReviewCount };
  } catch (err) {
    console.error("Error in searchCourses:", err);
    throw err;
  }
};

export const getLecture = async ({ courseId, lectureId, user }) => {
  const lecture = await Lecture.findById(lectureId).populate("section");
  if (!lecture)
    return { error: { status: 404, message: "Bài giảng không tồn tại" } };

  const section = lecture.section
    ? lecture.section
    : await Section.findById(lecture.section);
  if (!section || section.course.toString() !== courseId.toString()) {
    return {
      error: { status: 400, message: "Lecture không thuộc khóa học này" },
    };
  }

  if (lecture.isPreviewFree) return { lecture };

  if (!user)
    return {
      error: { status: 401, message: "Vui lòng đăng nhập để xem bài giảng" },
    };

  const isInstructorOrAdmin = user.role === "admin" || await Course.exists({ _id: courseId, instructor: user._id });

  if (!isInstructorOrAdmin) {
    const enrolled = await Enrollment.findOne({
      student: user._id,
      course: courseId,
    });
    if (!enrolled)
      return { error: { status: 403, message: "Bạn chưa mua khóa học này" } };

    if (!enrolled.isActivated)
      return { error: { status: 403, message: "Khóa học chưa được kích hoạt" } };

    if (enrolled.endedAt && enrolled.endedAt < new Date())
      return { error: { status: 403, message: "Khóa học đã hết thời hạn sử dụng" } };
  }

  const lectureObj = lecture.toObject();
  if (lectureObj.resources) {
    lectureObj.resources = lectureObj.resources.map(res => {
      if (res.url && res.url.includes('cloudfront.net')) {
        return {
          ...res,
          url: signThumbnailUrl(res.url)
        };
      }
      return res;
    });
  }

  return { lecture: lectureObj };
};

// ======================== AWS S3 NOTE ========================
// Video và Resource upload không còn đi qua server.
// Frontend upload trực tiếp lên S3 qua Presigned URL.
// Backend chỉ lưu CDN URL sau khi upload xong.
// =============================================================

// Hàm helper để chuẩn hóa input mảng từ FormData
// Vì FormData gửi 1 item sẽ là string, gửi nhiều là array. Chúng ta cần ép về Array.
const parseArrayField = (fieldData) => {
  if (!fieldData) return [];
  if (Array.isArray(fieldData)) return fieldData;
  return [fieldData];
};

/**
 * Tạo khóa học mới (Bao gồm Sections và Lectures)
 * Sau khi ADMIN duyệt sẽ tạo
 * SẼ ĐIỀU CHỈNH LẠI SAU, HIỆN KHÔNG DÙNG
 */
export const createCourse = async (courseData, thumbnailFile, instructorId) => {
  // Logic Validation: Nếu KHÔNG phải Draft thì mới bắt buộc validate kỹ
  const isDraft = courseData.status === 'draft' || courseData.status === 'hidden';

  // Các field khác nếu thiếu khi Submit (Pending) thì Frontend đã chặn rồi.
  // Backend chỉ cần đảm bảo không crash.

  // 1. Xử lý Thumbnail
  let thumbnailUrl = "";
  if (thumbnailFile) {
    const uploadResult = await uploadToCloudinary(
      thumbnailFile.buffer,
      "dreamcourse/thumbnails"
    );
    thumbnailUrl = uploadResult.secure_url;
  } else if (courseData.thumbnail) {
    thumbnailUrl = courseData.thumbnail.split('?')[0];
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
          slug: newCatSlug,
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

  // 5. Tạo Course (Draft trước)
  const newCourse = new Course({
    title: courseData.title,
    slug: slug,
    thumbnail: thumbnailUrl,
    previewUrl: courseData.previewUrl || "", // URL Youtube đã upload từ Frontend

    shortDescription: courseData.shortDescription,
    description: courseData.description,

    price: Number(courseData.price) || 0,
    priceDiscount: Number(courseData.priceDiscount) || 0,

    level: courseData.level || "alllevels",
    language: courseData.language || "Vietnamese",

    // Mảng String
    learnOutcomes,
    requirements,
    audience,
    includes,

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
    rating: 0,
  });

  const savedCourse = await newCourse.save();

  // 6. Xử lý Sections và Lectures (Nếu có gửi kèm)
  // courseData.sections là chuỗi JSON từ formData, cần parse
  let sectionsData = [];
  try {
    // Frontend gửi JSON string cho cấu trúc phức tạp này
    sectionsData = JSON.parse(courseData.sections || "[]");
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
          resources: lecData.resources.map(res => ({
            title: res.title,
            url: res.url,
            type: res.type
          }))
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
      order: sectionData.order || 0, // Bạn nên handle order ở frontend
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
  savedCourse.totalHours = parseFloat(
    (calculatedTotalDuration / 3600).toFixed(1)
  ); // Đổi ra giờ, lấy 1 số lẻ

  await savedCourse.save();

  return savedCourse;
};

export const getCourseStats = async () => {
  // Đếm theo price
  const allCount = await Course.countDocuments({ status: "published" });
  const freeCount = await Course.countDocuments({
    price: 0,
    status: "published",
  });
  const paidCount = await Course.countDocuments({
    price: { $gt: 0 },
    status: "published",
  });

  // Đếm theo level
  const levels = ["beginner", "intermediate", "advanced", "alllevels"];
  const levelStats = {};
  for (const lv of levels) {
    levelStats[lv] = await Course.countDocuments({
      level: lv,
      status: "published",
    });
  }

  return {
    price: {
      all: allCount,
      free: freeCount,
      paid: paidCount,
    },
    level: levelStats,
  };
};

// Instructor course features (getInstructorCourses, getCourseForEdit, createOrUpdateRevision, deleteCourse, activateCourse) have been moved to instructor.service.js


// ==================== ADMIN SERVICES ====================