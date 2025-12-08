import Course from './course.model.js';
import CourseRevision from './courseRevision.model.js';
import Review from '../review/review.model.js';
import Progress from '../progress/progress.model.js';
import Lecture from "./lecture.model.js";
import Section from "./section.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import Category from "../category/category.model.js";
import { uploadToYouTube } from "../../config/youtube.js";
import { uploadToCloudinary, uploadResourceToCloudinary } from "../../config/cloudinary.js";
import slugify from "slugify";
import mongoose from "mongoose";
/**
 * Service: Lấy chi tiết khóa học
 * @param {string} slug - Slug của khóa học
 * @returns {Promise<object>} - Dữ liệu chi tiết của khóa học
 */
export const getCourseDetailsBySlug = async (slug) => {
  const course = await Course.findOne({ slug: slug, status: "published" })
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

  const reviews = await Review.find({ course: course._id })
    .populate({
      path: "student",
      select: "name avatar",
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

  const filter = { status: "published" };
  if (query.category) {
  }

  const courses = await Course.find(filter)
    .select(
      "title slug thumbnail price priceDiscount level rating reviewCount instructor categories"
    )
    .populate("instructor", "name avatar")
    .populate("categories", "name slug")
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
      totalPages,
    },
  };
};

export const getLearningDetails = async (slug, userId) => {
  const course = await Course.findOne({ slug })
    .select("title slug sections totalLectures thumbnail instructor")
    .populate({
      path: "sections",
      select: "title order",
      options: { sort: { order: 1 } },
      populate: {
        path: "lectures",
        model: "Lecture",
        select: "title videoUrl duration isPreviewFree order resources",
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
    };
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

    return { total, page, limit, courses };
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

  const enrolled = await Enrollment.findOne({
    student: user._id,
    course: courseId,
  });
  if (!enrolled)
    return { error: { status: 403, message: "Bạn chưa mua khóa học này" } };

  return { lecture };
};

/**
 * Upload video lên YouTube (Service riêng để gọi từ Controller)
 */
export const uploadVideo = async (file, title) => {
  return await uploadToYouTube(file.buffer, title, "Uploaded via DreamsLMS");
};

/**
 * Upload Resource lên Cloudinary
 */
export const uploadResource = async (file, title) => {
  return await uploadResourceToCloudinary(file, title);
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

/**
 * Lấy danh sách khóa học của Instructor (có phân trang & lọc)
 */
export const getInstructorCourses = async (instructorId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 9;
  const skip = (page - 1) * limit;
  const statusFilter = query.status; // 'published', 'pending', 'draft', 'hidden', 

  // 1. Lấy tất cả Course "chính thức" (Published, Hidden, Archived)
  // Lưu ý: Không phân trang ở đây, cần lấy hết để merge rồi mới cắt trang
  const courses = await Course.find({ instructor: instructorId })
    .select('title slug thumbnail price priceDiscount level rating studentsCount status totalLectures totalHours createdAt')
    .lean();

  // 2. Lấy tất cả Revision của instructor
  // Ta cần status 'draft', 'pending', hoặc 'rejected' để xác định trạng thái
  const allRevisions = await CourseRevision.find({
    instructor: instructorId,
    status: { $in: ['draft', 'pending', 'rejected'] }
  }).lean();

  // --- XỬ LÝ GỘP DỮ LIỆU ---

  const mergedList = [];

  // A. Xử lý các Course chính thức
  courses.forEach(course => {
    // Tìm xem course này có bản revision nào đang treo không
    const activeRevision = allRevisions.find(r => r.course && r.course.toString() === course._id.toString());

    mergedList.push({
      ...course,
      // Gắn thêm cờ revisionStatus
      revisionStatus: activeRevision ? activeRevision.status : null,
      reviewMessage: activeRevision?.reviewMessage || null, // Message từ admin khi reject
      type: 'course' // Đánh dấu đây là course thật
    });
  });

  // B. Xử lý các Revision "độc lập" (Course mới chưa từng publish)
  // Là các revision mà field 'course' bị null
  const standaloneRevisions = allRevisions.filter(r => !r.course);

  standaloneRevisions.forEach(rev => {
    // Chuẩn hóa data từ revision.data ra ngoài để giống cấu trúc Course
    // Giúp Frontend hiển thị thống nhất mà không cần sửa nhiều
    mergedList.push({
      _id: rev._id, // Dùng ID của revision
      title: rev.data.title || 'Untitled Course',
      slug: rev.data.slug,
      thumbnail: rev.data.thumbnail,
      price: rev.data.price || 0,
      priceDiscount: rev.data.priceDiscount,
      totalLectures: rev.data.sections ? rev.data.sections.reduce((acc, sec) => acc + (sec.lectures?.length || 0), 0) : 0,
      totalHours: 0, // Tính toán nếu cần
      status: rev.status, // 'draft', 'pending', hoặc 'rejected'
      revisionStatus: null, // Không có revision con
      reviewMessage: rev.reviewMessage || null,
      type: 'revision', // Đánh dấu là revision
      createdAt: rev.createdAt
    });
  });

  // --- LỌC (FILTER) ---
  let finalCourses = mergedList;

  if (statusFilter && statusFilter !== 'all') {
    finalCourses = finalCourses.filter(c => {
      // Logic filter status
      // Nếu filter = pending -> Lấy course pending HOẶC course published đang có revision pending
      if (statusFilter === 'pending') {
        return c.status === 'pending' || c.revisionStatus === 'pending';
      }
      // Nếu filter = rejected -> Lấy course rejected HOẶC course có revision rejected
      if (statusFilter === 'rejected') {
        return c.status === 'rejected' || c.revisionStatus === 'rejected';
      }
      return c.status === statusFilter;
    });
  }

  // --- THỐNG KÊ (STATS) ---
  const stats = { all: 0, published: 0, pending: 0, draft: 0, hidden: 0, archived: 0, rejected: 0 };
  mergedList.forEach(c => {
    stats.all++;
    // Logic đếm stats: Ưu tiên trạng thái revision nếu là pending hoặc rejected
    if (c.status === 'pending' || c.revisionStatus === 'pending') {
      stats.pending++;
    } else if (c.status === 'rejected' || c.revisionStatus === 'rejected') {
      stats.rejected++;
    } else if (c.status === 'draft') {
      stats.draft++;
    } else if (c.status === 'published') {
      stats.published++;
    } else if (c.status === 'hidden') {
      stats.hidden++;
    } else if (c.status === 'archived') {
      stats.archived++;
    }
  });

  // --- SẮP XẾP (SORT) ---
  // Mới nhất lên đầu
  finalCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // --- PHÂN TRANG (PAGINATION) ---
  const total = finalCourses.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = finalCourses.slice((page - 1) * limit, page * limit);

  return {
    courses: paginatedData,
    stats,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Lấy dữ liệu để Edit (Xử lý 3 trường hợp)
 */
export const getCourseForEdit = async (slug, instructorId) => {
  // BƯỚC 1: Tìm xem có Course LIVE (Published/Hidden) nào khớp slug không?
  const liveCourse = await Course.findOne({ slug, instructor: instructorId }).lean();

  if (liveCourse) {
    // --- TRƯỜNG HỢP 2 & 3: Course đã từng publish ---

    // Tìm xem có bản Revision nào đang treo (draft/pending/rejected) của course này không
    const existingRevision = await CourseRevision.findOne({
      course: liveCourse._id,
      status: { $in: ['draft', 'pending', 'rejected'] }
    }).lean();

    // CASE 3: Đang Pending -> Chặn
    if (existingRevision && existingRevision.status === 'pending') {
      const error = new Error("Khóa học đang chờ duyệt, không thể chỉnh sửa.");
      error.statusCode = 400;
      throw error;
    }

    // CASE 2.1.1: Đã có bản Draft -> Trả về bản Draft để edit tiếp
    if (existingRevision && existingRevision.status === 'draft') {
      return {
        ...existingRevision.data, // Bung dữ liệu trong field 'data' ra
        _id: existingRevision._id, // ID của revision
        courseId: liveCourse._id,  // ID của course gốc
        status: 'draft',
        reviewMessage: existingRevision.reviewMessage || null,
        isUpdateMode: true // Cờ báo frontend đây là update course cũ
      };
    }

    // CASE 2.1.2: Có bản Rejected -> Cho phép edit lại
    if (existingRevision && existingRevision.status === 'rejected') {
      return {
        ...existingRevision.data,
        _id: existingRevision._id,
        courseId: liveCourse._id,
        status: 'rejected',
        reviewMessage: existingRevision.reviewMessage || null,
        isUpdateMode: true
      };
    }

    // CASE 2.2: Chưa có bản Draft (Lần đầu sửa sau khi publish) -> Clone từ Course Live
    // Phải map lại cấu trúc từ Course Model -> Form Data Structure
    // Lưu ý: Course Model lưu sections là mảng ObjectId, ta cần populate để lấy data
    const populatedCourse = await Course.findById(liveCourse._id)
      .populate({
        path: 'sections',
        populate: { path: 'lectures' }
      }).lean();

    // Convert cấu trúc Section/Lecture DB sang cấu trúc JSON lưu trong Revision
    const sectionsStruct = populatedCourse.sections.map(sec => ({
      title: sec.title,
      order: sec.order,
      lectures: sec.lectures.map(lec => ({
        title: lec.title,
        videoUrl: lec.videoUrl,
        duration: lec.duration,
        order: lec.order,
        isPreviewFree: lec.isPreviewFree,
        resources: lec.resources.map(res => ({
          title: res.title,
          url: res.url,
          type: res.type
        }))
      }))
    }));

    return {
      title: populatedCourse.title,
      slug: populatedCourse.slug, // Giữ slug cũ
      thumbnail: populatedCourse.thumbnail,
      previewUrl: populatedCourse.previewUrl,
      shortDescription: populatedCourse.shortDescription,
      description: populatedCourse.description,
      price: populatedCourse.price,
      priceDiscount: populatedCourse.priceDiscount,
      level: populatedCourse.level,
      language: populatedCourse.language,
      requirements: populatedCourse.requirements || [],
      learnOutcomes: populatedCourse.learnOutcomes || [],
      audience: populatedCourse.audience || [],
      includes: populatedCourse.includes || [],
      categories: populatedCourse.categories, // Array IDs
      sections: sectionsStruct,

      courseId: populatedCourse._id, // Quan trọng: Đánh dấu revision này thuộc về course nào
      status: 'draft', // Bắt đầu là draft
      isUpdateMode: true
    };
  }

  // --- TRƯỜNG HỢP 1: Course chưa từng publish (Fresh Draft) ---
  // Tìm trong Revision xem có slug khớp không (lưu ý tìm trong data.slug)
  const freshDraft = await CourseRevision.findOne({
    'data.slug': slug,
    instructor: instructorId,
    course: null, // Chưa link tới course nào
    status: 'draft'
  }).lean();

  if (freshDraft) {
    return {
      ...freshDraft.data,
      _id: freshDraft._id,
      status: 'draft',
      isUpdateMode: false
    };
  }

  // Nếu pending (Fresh Pending) -> Chặn
  const freshPending = await CourseRevision.findOne({
    'data.slug': slug,
    instructor: instructorId,
    course: null,
    status: 'pending'
  });
  if (freshPending) {
    const error = new Error("Khóa học đang chờ duyệt, không thể chỉnh sửa.");
    error.statusCode = 400;
    throw error;
  }

  // Nếu rejected (Fresh Rejected) -> Cho phép edit lại
  const freshRejected = await CourseRevision.findOne({
    'data.slug': slug,
    instructor: instructorId,
    course: null,
    status: 'rejected'
  }).lean();
  if (freshRejected) {
    return {
      ...freshRejected.data,
      _id: freshRejected._id,
      status: 'rejected',
      reviewMessage: freshRejected.reviewMessage || null,
      isUpdateMode: false
    };
  }

  const error = new Error("Không tìm thấy khóa học hoặc bản nháp phù hợp.");
  error.statusCode = 404;
  throw error;
};

/**
 * Tạo hoặc cập nhật Course Revision
 */
export const createOrUpdateRevision = async (courseData, thumbnailFile, instructorId) => {
  // 1. Xử lý Thumbnail
  let thumbnailUrl = courseData.thumbnailUrl || ''; // Nếu edit thì có thể có URL cũ
  if (thumbnailFile) {
    const uploadResult = await uploadToCloudinary(thumbnailFile.buffer, 'dreamcourse/thumbnails');
    thumbnailUrl = uploadResult.secure_url;
  }

  // 2. Xử lý Category (Giống bài trước)
  const rawCategories = parseArrayField(courseData.categories);
  const finalCategoryIds = [];
  for (const catInput of rawCategories) {
    if (mongoose.Types.ObjectId.isValid(catInput)) {
      finalCategoryIds.push(catInput);
    } else {
      let existingCat = await Category.findOne({ name: catInput });
      if (existingCat) {
        finalCategoryIds.push(existingCat._id);
      } else {
        const newCatSlug = slugify(catInput, { lower: true, strict: true });
        const newCategory = await Category.create({ name: catInput, slug: newCatSlug });
        finalCategoryIds.push(newCategory._id);
      }
    }
  }

  // 3. Chuẩn hóa mảng
  const learnOutcomes = parseArrayField(courseData.learnOutcomes);
  const requirements = parseArrayField(courseData.requirements);
  const audience = parseArrayField(courseData.audience);
  const includes = parseArrayField(courseData.includes);

  // . Xử lý Sections (Không tạo doc Section/Lecture thật, chỉ lưu JSON trong Revision)
  let sectionsData = [];
  try {
    sectionsData = JSON.parse(courseData.sections || '[]');
  } catch (e) {
    console.error("Error parsing sections JSON:", e);
  }

  // Chuẩn hóa cấu trúc Section để lưu vào Revision.data
  const sectionsStruct = sectionsData.map(sec => ({
    title: sec.title,
    order: sec.order || 0,
    lectures: sec.lectures.map(lec => ({
      title: lec.title,
      videoUrl: lec.videoUrl,
      duration: Number(lec.duration) || 0,
      order: lec.order || 0,
      isPreviewFree: lec.isPreviewFree || false,
      resources: lec.resources.map(res => ({
        title: res.title,
        url: res.url,
        type: res.type
      }))
    }))
  }));

  // 5. Chuẩn bị Data Object cho Revision
  const revisionData = {
    title: courseData.title,
    slug: courseData.slug, // Slug không đổi khi edit
    thumbnail: thumbnailUrl,
    previewUrl: courseData.previewUrl || '',
    shortDescription: courseData.shortDescription,
    description: courseData.description,
    price: Number(courseData.price) || 0,
    priceDiscount: Number(courseData.priceDiscount) || 0,
    level: courseData.level || 'alllevels',
    language: courseData.language || 'Vietnamese',

    learnOutcomes,
    requirements,
    audience,
    includes,

    categories: finalCategoryIds,
    sections: sectionsStruct
  };

  // --- [LOGIC VERSION MỚI] ---
  let nextVersion = 1; // Mặc định cho trường hợp 1 (Fresh Draft)

  // Trường hợp 2: Update Course đã publish (Có courseId)
  if (courseData.courseId) {
    // Tìm course gốc để lấy version hiện tại
    const liveCourse = await Course.findById(courseData.courseId).select('version');
    if (liveCourse) {
      // Version của bản Revision = Version Course gốc + 1
      // Dù instructor có save bao nhiêu lần thì liveCourse.version vẫn không đổi -> nextVersion vẫn giữ nguyên
      nextVersion = (liveCourse.version || 1) + 1;
    }
  }

  // 6. LOGIC SAVE/UPDATE QUAN TRỌNG
  // Check xem có draft/rejected nào đang tồn tại không để update đè lên, tránh spam record
  const filter = {
    instructor: instructorId,
    status: { $in: ['draft', 'rejected'] } // Cho phép update cả draft và rejected
  };

  // Nếu có courseId (Case 2: Update Course Live)
  if (courseData.courseId) {
    filter.course = courseData.courseId;
  } else {
    // Case 1: Fresh Draft -> Tìm theo slug
    filter.course = null;
    filter['data.slug'] = courseData.slug;
  }

  // Thực hiện Upsert (Tìm thấy thì update, không thì tạo mới)
  const updatedRevision = await CourseRevision.findOneAndUpdate(
    filter,
    {
      instructor: instructorId,
      course: courseData.courseId || null, // Nếu null thì là fresh draft
      status: courseData.status || 'draft',
      version: nextVersion, // Version của bản Revision = Version Course gốc + 1
      data: revisionData,
      reviewMessage: courseData.status === 'pending' ? (courseData.messageToReviewer || '') : '' // Clear message nếu save draft
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return updatedRevision;
};

/**
 * Xóa khóa học (Xử lý cả 3 trường hợp A, B, C)
 */
export const deleteCourse = async (id, instructorId) => {
  // BƯỚC 1: Tìm trong Collection COURSE trước (Cho Case B & C)
  const course = await Course.findOne({ _id: id, instructor: instructorId });

  if (course) {
    // --- TRƯỜNG HỢP C: Đã có học viên -> Archive ---
    if (course.studentsCount > 0) {
      // Nếu đã archived rồi thì không cần làm gì hoặc báo lỗi tùy bạn
      if (course.status === 'archived') {
        return { message: "Khóa học đã được lưu trữ.", action: "archived" };
      }

      course.status = 'archived';
      await course.save();
      return {
        message: "Khóa học đã chuyển sang trạng thái Lưu trữ (Archived) vì đã có học viên.",
        action: "archived"
      };
    }

    // --- TRƯỜNG HỢP B: Chưa có học viên -> Hidden ---
    else {
      // Logic: Ẩn khóa học khỏi marketplace
      course.status = 'hidden';
      await course.save();
      return {
        message: "Khóa học đã được ẩn (Hidden).",
        action: "hidden"
      };
    }
  }

  // BƯỚC 2: Nếu không tìm thấy Course, tìm trong REVISION (Cho Case A - Fresh Draft)
  // Lưu ý: Fresh Draft có course: null
  const revision = await CourseRevision.findOne({
    _id: id,
    instructor: instructorId,
    course: null // Đảm bảo đây là fresh draft chưa link tới course nào
  });

  if (revision) {
    // --- TRƯỜNG HỢP A: Course Draft (Chưa từng publish) ---
    await CourseRevision.findByIdAndDelete(id);
    return {
      message: "Đã xóa vĩnh viễn bản nháp khóa học.",
      action: "deleted"
    };
  }

  // Nếu không tìm thấy ở cả 2 nơi
  const error = new Error("Không tìm thấy khóa học hoặc bạn không có quyền xóa.");
  error.statusCode = 404;
  throw error;
};

/**
 * Kích hoạt lại khóa học (Hidden -> Published)
 */
export const activateCourse = async (courseId, instructorId) => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId });
  if (!course) throw new Error("Course not found");

  // Chỉ cho phép kích hoạt nếu đang hidden hoặc archived
  if (course.status === 'hidden' || course.status === 'archived') {
    course.status = 'published';
    await course.save();
    return { message: "Khóa học đã được xuất bản trở lại (Published)." };
  }
  throw new Error("Khóa học đang ở trạng thái không thể kích hoạt nhanh.");
};

// ==================== ADMIN SERVICES ====================