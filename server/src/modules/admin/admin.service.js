// src/modules/admin/admin.service.js
import User from '../auth/auth.model.js';
import Course from '../course/course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Payment from '../payment/payment.model.js';
import Category from '../category/category.model.js';
import CourseRevision from '../course/courseRevision.model.js';
import Progress from '../progress/progress.model.js';
import Lecture from '../course/lecture.model.js';
import Section from '../course/section.model.js';
import InstructorApplication from '../user/instructorApplication.model.js';
import InstructorProfile from '../user/InstructorProfile.model.js';
import notificationService from "../notification/notification.service.js";
import { generateCourseEmbedding } from '../../utils/ai.service.js';
import { comparePassword } from '../../utils/password.utils.js';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt.utils.js';
import { signThumbnailUrl } from '../../config/aws.js';

const signCourseResources = (courseData) => {
  if (courseData && courseData.sections) {
    courseData.sections.forEach(sec => {
      if (sec.lectures) {
        sec.lectures.forEach(lec => {
          if (lec.resources) {
            lec.resources.forEach(res => {
              if (res.url) {
                res.url = signThumbnailUrl(res.url);
              }
            });
          }
        });
      }
    });
  }
  return courseData;
};

/**
 * Service: Đăng nhập dành riêng cho Admin
 * - CHỈ cho phép role 'admin'
 * - CHỈ cho phép phương thức local (email + password)
 * - KHÔNG hỗ trợ Google/Facebook
 */
export const loginAdmin = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        throw error;
    }

    // [BẢO MẬT] Chỉ cho phép tài khoản Admin
    if (user.role !== 'admin') {
        const error = new Error('Bạn không có quyền truy cập trang quản trị.');
        error.statusCode = 403;
        throw error;
    }

    // [BẢO MẬT] Chỉ cho phép đăng nhập bằng Local
    if (user.authProvider !== 'local' || !user.password) {
        const error = new Error('Tài khoản Admin phải đăng nhập bằng Email và Mật khẩu.');
        error.statusCode = 403;
        throw error;
    }

    if (!user.isVerified) {
        const error = new Error('Tài khoản Admin chưa được kích hoạt.');
        error.statusCode = 401;
        throw error;
    }

    if (!user.isActive) {
        const error = new Error('Tài khoản Admin đã bị vô hiệu hóa. Vui lòng liên hệ hệ thống.');
        error.statusCode = 403;
        throw error;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        const error = new Error('Email hoặc mật khẩu không đúng');
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const userResponse = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };

    return { user: userResponse, accessToken, refreshToken };
};

export const getPendingApplications = async () => {
  const applications = await User.find({
    'instructorApplication.status': 'pending'
  })
    .select('name email avatar instructorApplication');

  return applications;
};

/**
 * Service: Admin duyệt (approve/reject) yêu cầu
 * @param {string} targetUserId - ID của user được duyệt
 * @param {string} decision - 'approve' hoặc 'reject'
 * @param {string} adminNotes - Ghi chú của Admin
 */
export const reviewApplication = async (targetUserId, decision, adminNotes) => {
  const user = await User.findById(targetUserId);

  if (!user || user.instructorApplication.status !== 'pending') {
    const error = new Error('Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý.');
    error.statusCode = 404;
    throw error;
  }

  if (decision === 'approve') {
    user.role = 'instructor';
    user.instructorApplication.status = 'approved';
    user.instructorApplication.reviewedAt = new Date();
    user.instructorApplication.adminNotes = adminNotes;

    await notificationService.createNotification({
      recipient: user._id,
      type: "system",
      title: "Hồ sơ giảng viên được duyệt",
      message: "Chúc mừng! Yêu cầu trở thành giảng viên của bạn đã được phê duyệt. Bạn có thể bắt đầu tạo khóa học ngay bây giờ.",
      metadata: { adminNote: adminNotes, url: "/instructor/dashboard" }
    }).catch(err => console.error("Lỗi gửi thông báo:", err));

  } else if (decision === 'reject') {
    user.instructorApplication.status = 'rejected';
    user.instructorApplication.reviewedAt = new Date();
    user.instructorApplication.adminNotes = adminNotes;

    await notificationService.createNotification({
      recipient: user._id,
      type: "system",
      title: "Hồ sơ giảng viên bị từ chối",
      message: `Rất tiếc, yêu cầu trở thành giảng viên của bạn đã bị từ chối.${adminNotes ? `\n\nGhi chú từ admin: ${adminNotes}` : ""}`,
      metadata: { adminNote: adminNotes, url: "/profile/become-instructor" }
    }).catch(err => console.error("Lỗi gửi thông báo:", err));
  } else {
    const error = new Error('Quyết định không hợp lệ.');
    error.statusCode = 400;
    throw error;
  }

  await user.save();
  return { message: `Đã ${decision} yêu cầu của ${user.name}.` };
};

export const getDashboardCounts = async () => {
  const [
    totalStudents,
    totalInstructors,
    pendingInstructors,
    totalCourses,
    pendingCourses
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    User.countDocuments({ 'instructorApplication.status': 'pending' }),
    Course.countDocuments({ status: 'published' }),
    CourseRevision.countDocuments({ status: 'pending' })
  ]);

  return {
    users: {
      students: totalStudents,
      instructors: totalInstructors,
      pendingInstructors
    },
    courses: {
      published: totalCourses,
      pending: pendingCourses
    }
  };
};

export const getTopCourses = async (limit = 5) => {
  const courses = await Course.find({ status: 'published' })
    .sort({ studentsCount: -1 })
    .limit(limit)
    .select('title slug thumbnail studentsCount price rating instructor')
    .populate('instructor', 'name avatar')
    .lean();

  courses.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  return courses;
};

export const getCategoryStats = async () => {
  return await Course.aggregate([
    { $match: { status: 'published' } },
    { $unwind: "$categories" },
    {
      $group: {
        _id: "$categories",
        count: { $sum: 1 },
        totalStudents: { $sum: "$studentsCount" }
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    { $unwind: "$categoryInfo" },
    {
      $project: {
        _id: 1,
        name: "$categoryInfo.name",
        count: 1,
        totalStudents: 1
      }
    },
    { $sort: { totalStudents: -1 } }
  ]);
};

export const getRevenueStats = async (type, yearParam, monthParam) => {
  const now = new Date();
  const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
  const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1; // 1-12

  let matchStage = { status: 'success' };
  let groupId = {};
  let sortId = {};

  let start, end;

  if (type === 'year') {
    start = new Date(currentYear, 0, 1);
    end = new Date(currentYear, 11, 31, 23, 59, 59);

    matchStage.createdAt = { $gte: start, $lte: end };

    groupId = { month: { $month: "$createdAt" } };
    sortId = { "_id.month": 1 };

  } else if (type === 'month') {
    start = new Date(currentYear, currentMonth - 1, 1);
    end = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    matchStage.createdAt = { $gte: start, $lte: end };

    groupId = { day: { $dayOfMonth: "$createdAt" } };
    sortId = { "_id.day": 1 };

  } else if (type === 'week') {

    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);

    start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end = new Date();

    matchStage.createdAt = { $gte: start, $lte: end };

    groupId = { day: { $dayOfMonth: "$createdAt" }, month: { $month: "$createdAt" } };
    sortId = { "_id.day": 1 };
  }

  const stats = await Payment.aggregate([
    { $match: matchStage },
    {
      $project: {
        createdAt: 1,
        amount: 1,
        netPriceSum: { $sum: { $ifNull: ["$items.netPrice", 0] } },
        vatAmountSum: { $sum: { $ifNull: ["$items.vatAmount", 0] } },
        adminShareSum: { $sum: { $ifNull: ["$items.adminShare", 0] } }
      }
    },
    {
      $group: {
        _id: groupId,
        gross: { $sum: "$amount" },
        net: { $sum: "$netPriceSum" },
        vat: { $sum: "$vatAmountSum" },
        platformNet: { $sum: "$adminShareSum" },
        count: { $sum: 1 }
      }
    },
    { $sort: sortId }
  ]);

  let formattedData = [];

  if (type === 'year') {
    for (let i = 1; i <= 12; i++) {
      const found = stats.find(item => item._id.month === i);
      formattedData.push({
        label: `Tháng ${i}`,
        value: found ? found.gross : 0,
        net: found ? found.net : 0,
        vat: found ? found.vat : 0,
        platformNet: found ? found.platformNet : 0,
        count: found ? found.count : 0
      });
    }
  } else if (type === 'month') {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const found = stats.find(item => item._id.day === i);
      formattedData.push({
        label: `${i}/${currentMonth}`,
        value: found ? found.gross : 0,
        net: found ? found.net : 0,
        vat: found ? found.vat : 0,
        platformNet: found ? found.platformNet : 0,
        count: found ? found.count : 0
      });
    }
  } else {
    formattedData = stats.map(item => ({
      label: `${item._id.day}/${item._id.month}`,
      value: item.gross,
      net: item.net,
      vat: item.vat,
      platformNet: item.platformNet,
      count: item.count
    }));
  }

  const totalStats = await Payment.aggregate([
    { $match: { status: 'success' } },
    {
      $project: {
        amount: 1,
        netPriceSum: { $sum: { $ifNull: ["$items.netPrice", 0] } },
        vatAmountSum: { $sum: { $ifNull: ["$items.vatAmount", 0] } },
        adminShareSum: { $sum: { $ifNull: ["$items.adminShare", 0] } }
      }
    },
    {
      $group: {
        _id: null,
        totalGross: { $sum: "$amount" },
        totalNet: { $sum: "$netPriceSum" },
        totalVAT: { $sum: "$vatAmountSum" },
        totalPlatformNet: { $sum: "$adminShareSum" }
      }
    }
  ]);

  return {
    chartData: formattedData,
    totalRevenue: totalStats[0]?.totalGross || 0,
    totalNet: totalStats[0]?.totalNet || 0,
    totalVAT: totalStats[0]?.totalVAT || 0,
    totalPlatformNet: totalStats[0]?.totalPlatformNet || 0,
    period: { type, start, end }
  };
};

export const getAllStudents = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || '';
  const skip = (page - 1) * limit;

  const filter = { role: 'student' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // 2. Query DB lấy User
  const students = await User.find(filter)
    .select('name email avatar phone createdAt isVerified isActive')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalStudents = await User.countDocuments(filter);

  const studentsWithStats = await Promise.all(
    students.map(async (student) => {
      const enrolledCount = await Enrollment.countDocuments({ student: student._id });
      return {
        ...student,
        coursesEnrolled: enrolledCount
      };
    })
  );

  return {
    students: studentsWithStats,
    pagination: {
      total: totalStudents,
      page,
      limit,
      totalPages: Math.ceil(totalStudents / limit)
    }
  };
};


/**
/**
 * Lấy danh sách Course Revisions cần admin xử lý (pending + changes_requested)
 */
export const getPendingRevisions = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const statusFilter = query.status; // 'pending' | 'changes_requested' | 'all'

  // Xây dựng filter
  let statusQuery;
  if (statusFilter === 'pending') {
    statusQuery = 'pending';
  } else if (statusFilter === 'changes_requested') {
    statusQuery = 'changes_requested';
  } else {
    // Default: lấy cả pending và changes_requested
    statusQuery = { $in: ['pending', 'changes_requested'] };
  }

  const revisions = await CourseRevision.find({ status: statusQuery })
    .populate('instructor', 'name email avatar')
    .populate('course', 'title slug status version')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await CourseRevision.countDocuments({ status: statusQuery });

  // Stats riêng theo từng status
  const [pendingCount, changesRequestedCount] = await Promise.all([
    CourseRevision.countDocuments({ status: 'pending' }),
    CourseRevision.countDocuments({ status: 'changes_requested' }),
  ]);

  const formattedRevisions = revisions.map(rev => ({
    _id: rev._id,
    title: rev.data.title || 'Untitled Course',
    thumbnail: signThumbnailUrl(rev.data.thumbnail),
    price: rev.data.price || 0,
    instructor: rev.instructor,
    courseId: rev.course?._id || null,
    courseName: rev.course?.title || null,
    courseStatus: rev.course?.status || null,
    revisionStatus: rev.status,
    reviewMessage: rev.reviewMessage || null,
    submittedAt: rev.submittedAt || rev.updatedAt,
    version: rev.version,
    type: rev.course ? 'update' : 'new', // "new" = Case 1, "update" = Case 6
    sectionsCount: (rev.data.sections || []).length,
    lecturesCount: (rev.data.sections || []).reduce((acc, s) => acc + (s.lectures?.length || 0), 0),
  }));

  return {
    revisions: formattedRevisions,
    stats: { pending: pendingCount, changes_requested: changesRequestedCount },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

/**
 * Lấy tất cả khóa học (Admin) với filter đầy đủ + tính ĐỘNG doanh thu & số học sinh
 * Sử dụng MongoDB Aggregation Pipeline để join Payment & Enrollment
 */
export const getAllCoursesForAdmin = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const statusFilter = query.status || '';
  const search = query.search || '';
  const sortBy = query.sortBy || 'createdAt';   // revenue | students | price | createdAt
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const minPrice = query.minPrice != null ? Number(query.minPrice) : null;
  const maxPrice = query.maxPrice != null ? Number(query.maxPrice) : null;

  // ---------- Build $match ----------
  const matchStage = {};
  if (statusFilter && statusFilter !== 'all') {
    matchStage.status = statusFilter;
  }
  if (search) {
    matchStage.title = { $regex: search, $options: 'i' };
  }
  if (minPrice !== null || maxPrice !== null) {
    matchStage.price = {};
    if (minPrice !== null) matchStage.price.$gte = minPrice;
    if (maxPrice !== null) matchStage.price.$lte = maxPrice;
  }

  // ---------- Sort field mapping ----------
  const sortFieldMap = {
    revenue: 'totalRevenue',
    students: 'totalStudents',
    price: 'price',
    createdAt: 'createdAt',
  };
  const sortField = sortFieldMap[sortBy] || 'createdAt';

  // ---------- Aggregation Pipeline ----------
  const pipeline = [
    { $match: matchStage },

    // JOIN với Payment để tính doanh thu động
    {
      $lookup: {
        from: 'payments',
        let: { courseId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$status', 'success'] },
                  { $in: ['$$courseId', '$courses'] }
                ]
              }
            }
          },
          { $unwind: '$items' },
          {
            $match: {
              $expr: { $eq: ['$items.course', '$$courseId'] }
            }
          },
          {
            $group: {
              _id: null,
              totalGross: { $sum: { $ifNull: ['$items.finalPrice', 0] } },
              totalVAT: { $sum: { $ifNull: ['$items.vatAmount', 0] } },
              totalRevenue: { $sum: { $ifNull: ['$items.netPrice', 0] } },
              adminRevenue: { $sum: { $ifNull: ['$items.adminShare', 0] } },
              totalOrders: { $sum: 1 }
            }
          }
        ],
        as: 'paymentStats'
      }
    },

    // JOIN với Enrollment để đếm học sinh thực tế
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'course',
        as: 'enrollmentDocs'
      }
    },

    // JOIN instructor
    {
      $lookup: {
        from: 'users',
        localField: 'instructor',
        foreignField: '_id',
        as: 'instructorDoc'
      }
    },

    // Thêm các trường computed
    {
      $addFields: {
        totalGross: { $ifNull: [{ $arrayElemAt: ['$paymentStats.totalGross', 0] }, 0] },
        totalVAT: { $ifNull: [{ $arrayElemAt: ['$paymentStats.totalVAT', 0] }, 0] },
        totalRevenue: { $ifNull: [{ $arrayElemAt: ['$paymentStats.totalRevenue', 0] }, 0] },
        adminRevenue: { $ifNull: [{ $arrayElemAt: ['$paymentStats.adminRevenue', 0] }, 0] },
        totalOrders: { $ifNull: [{ $arrayElemAt: ['$paymentStats.totalOrders', 0] }, 0] },
        totalStudents: { $size: '$enrollmentDocs' },
        instructor: {
          $let: {
            vars: { inst: { $arrayElemAt: ['$instructorDoc', 0] } },
            in: {
              _id: '$$inst._id',
              name: '$$inst.name',
              email: '$$inst.email',
              avatar: '$$inst.avatar'
            }
          }
        }
      }
    },

    // Bỏ các mảng raw không cần thiết
    {
      $project: {
        paymentStats: 0,
        enrollmentDocs: 0,
        instructorDoc: 0,
      }
    },

    // Sort động
    { $sort: { [sortField]: sortOrder } },

    // Facet: vừa lấy data vừa đếm total (1 round-trip)
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    }
  ];

  const [result] = await Course.aggregate(pipeline);
  const courses = result?.data || [];
  const total = result?.totalCount?.[0]?.count || 0;

  // ---------- Stats theo status (tất cả courses, không filter) ----------
  const statusCounts = await Course.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const allCount = await Course.countDocuments();
  const stats = statusCounts.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, { all: allCount });

  courses.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  return {
    courses,
    stats,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};


/**
 * Lấy chi tiết CourseRevision đang chờ duyệt (Admin)
 * Accept cả 'pending' và 'changes_requested' (sau khi instructor sửa và resubmit)
 */
export const getPendingRevisionDetail = async (revisionId) => {
  const revision = await CourseRevision.findOne({
    _id: revisionId,
    status: { $in: ['pending', 'changes_requested'] } // ✅ Fix Bug 1: chấp nhận cả 2 status
  })
    .populate('instructor', 'name email avatar')
    .populate('course', 'title slug status version durationInWeeks')
    .populate('data.categories', 'name slug')
    .lean();

  if (!revision) {
    const error = new Error("Không tìm thấy khóa học đang chờ duyệt hoặc cần sửa.");
    error.statusCode = 404;
    throw error;
  }

  let originalCourse = null;
  if (revision.course) {
    originalCourse = await Course.findById(revision.course)
      .populate({ path: 'sections', populate: { path: 'lectures' } })
      .populate('categories', 'name slug')
      .lean();
  }

  if (originalCourse) {
    if (originalCourse.thumbnail) {
      originalCourse.thumbnail = signThumbnailUrl(originalCourse.thumbnail);
    }
    originalCourse = signCourseResources(originalCourse);
  }

  const signedRevision = signCourseResources({
    ...revision,
    ...revision.data,
    thumbnail: signThumbnailUrl(revision.data?.thumbnail)
  });

  return {
    revision: signedRevision,
    originalCourse,
    type: revision.course ? 'update' : 'new'
  };
};

/**
 * Duyệt khóa học (Approve)
 * - Case 1: Tạo Course mới từ Revision
 * - Case 2: Merge Revision vào Course hiện có
 */
export const approveRevision = async (revisionId, adminId) => {
  const revision = await CourseRevision.findById(revisionId);

  if (!revision) {
    const error = new Error("Không tìm thấy bản revision.");
    error.statusCode = 404;
    throw error;
  }

  // ✅ Fix: Cho phép approve cả 'pending' và 'changes_requested' (instructor đã sửa và resubmit)
  if (!['pending', 'changes_requested'].includes(revision.status)) {
    const error = new Error("Chỉ có thể duyệt các khóa học đang ở trạng thái Pending hoặc Changes Requested.");
    error.statusCode = 400;
    throw error;
  }

  let resultCourse;

  // --- CASE 1: Khóa học mới (chưa từng publish) ---
  if (!revision.course) {
    // Tạo Sections và Lectures thật
    const sectionIds = [];
    let totalLectures = 0;
    let totalDuration = 0;

    for (const sectionData of revision.data.sections || []) {
      const lectureIds = [];

      for (const lecData of sectionData.lectures || []) {
        const newLecture = await Lecture.create({
          title: lecData.title,
          videoUrl: lecData.videoUrl,
          duration: Number(lecData.duration) || 0,
          order: lecData.order || 0,
          isPreviewFree: lecData.isPreviewFree || false,
          resources: lecData.resources || [],
          // ── Copy quiz data từ revision ──────────────────────────────────────
          quizzes: (lecData.quizzes || []).map(q => ({
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            hint: q.hint || '',
            timestamp: Number(q.timestamp) || 0,
            isActive: q.isActive !== false,
          })),
        });
        lectureIds.push(newLecture._id);
        totalLectures++;
        totalDuration += newLecture.duration;
      }


      // Tạo Section (chưa có course, sẽ set sau)
      const newSection = await Section.create({
        title: sectionData.title,
        course: null, // Tạm null, sẽ update sau khi có Course
        lectures: lectureIds,
        order: sectionData.order || 0
      });

      // Update lại lecture.section
      await Lecture.updateMany(
        { _id: { $in: lectureIds } },
        { $set: { section: newSection._id } }
      );

      sectionIds.push(newSection._id);
    }

    // Tạo Course mới
    const newCourse = await Course.create({
      title: revision.data.title,
      slug: revision.data.slug, // ✨ Copy slug từ revision (đã được tạo khi instructor save draft)
      thumbnail: revision.data.thumbnail,
      previewUrl: revision.data.previewUrl,
      shortDescription: revision.data.shortDescription,
      description: revision.data.description,
      price: revision.data.price || 0,
      priceDiscount: revision.data.priceDiscount || 0,
      durationInWeeks: revision.data.durationInWeeks || 0,
      level: revision.data.level || 'alllevels',
      language: revision.data.language || 'Vietnamese',
      requirements: revision.data.requirements || [],
      learnOutcomes: revision.data.learnOutcomes || [],
      audience: revision.data.audience || [],
      includes: revision.data.includes || [],
      instructor: revision.instructor,
      categories: revision.data.categories || [],
      sections: sectionIds,
      status: 'published', // Duyệt = Publish luôn
      totalLectures,
      totalDurationSeconds: totalDuration,
      totalHours: parseFloat((totalDuration / 3600).toFixed(1)),
      version: 1
    });

    // Update lại section.course
    await Section.updateMany(
      { _id: { $in: sectionIds } },
      { $set: { course: newCourse._id } }
    );

    // Cập nhật Revision
    revision.status = 'approved';
    revision.course = newCourse._id; // Link revision với course vừa tạo
    await revision.save();

    resultCourse = newCourse;
  }
  // --- CASE 2: Update khóa học đã publish ---
  else {
    const liveCourse = await Course.findById(revision.course);

    if (!liveCourse) {
      const error = new Error("Không tìm thấy khóa học gốc.");
      error.statusCode = 404;
      throw error;
    }

    // Xóa các Section/Lecture cũ
    const oldSections = liveCourse.sections || [];
    for (const sectionId of oldSections) {
      const section = await Section.findById(sectionId);
      if (section) {
        // Xóa các lectures thuộc section này
        await Lecture.deleteMany({ _id: { $in: section.lectures } });
        await Section.findByIdAndDelete(sectionId);
      }
    }

    // Tạo lại Sections/Lectures mới từ Revision
    const sectionIds = [];
    let totalLectures = 0;
    let totalDuration = 0;

    for (const sectionData of revision.data.sections || []) {
      const lectureIds = [];

      for (const lecData of sectionData.lectures || []) {
        const newLecture = await Lecture.create({
          title: lecData.title,
          videoUrl: lecData.videoUrl,
          duration: Number(lecData.duration) || 0,
          order: lecData.order || 0,
          isPreviewFree: lecData.isPreviewFree || false,
          resources: lecData.resources || [],
          // ── Copy quiz data từ revision ──────────────────────────────────────
          quizzes: (lecData.quizzes || []).map(q => ({
            question: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            hint: q.hint || '',
            timestamp: Number(q.timestamp) || 0,
            isActive: q.isActive !== false,
          })),
        });
        lectureIds.push(newLecture._id);
        totalLectures++;
        totalDuration += newLecture.duration;
      }


      const newSection = await Section.create({
        title: sectionData.title,
        course: liveCourse._id,
        lectures: lectureIds,
        order: sectionData.order || 0
      });

      await Lecture.updateMany(
        { _id: { $in: lectureIds } },
        { $set: { section: newSection._id } }
      );

      sectionIds.push(newSection._id);
    }

    // Cập nhật Course
    liveCourse.title = revision.data.title;
    // ✨ KHÔNG update slug - giữ nguyên slug cũ của course
    // liveCourse.slug = revision.data.slug; // ❌ Bỏ dòng này
    liveCourse.thumbnail = revision.data.thumbnail;
    liveCourse.previewUrl = revision.data.previewUrl;
    liveCourse.shortDescription = revision.data.shortDescription;
    liveCourse.description = revision.data.description;
    liveCourse.price = revision.data.price || 0;
    liveCourse.priceDiscount = revision.data.priceDiscount || 0;
    liveCourse.durationInWeeks = revision.data.durationInWeeks || 0;
    liveCourse.level = revision.data.level;
    liveCourse.language = revision.data.language;
    liveCourse.requirements = revision.data.requirements || [];
    liveCourse.learnOutcomes = revision.data.learnOutcomes || [];
    liveCourse.audience = revision.data.audience || [];
    liveCourse.includes = revision.data.includes || [];
    liveCourse.categories = revision.data.categories || [];
    liveCourse.sections = sectionIds;
    liveCourse.totalLectures = totalLectures;
    liveCourse.totalDurationSeconds = totalDuration;
    liveCourse.totalHours = parseFloat((totalDuration / 3600).toFixed(1));
    liveCourse.version = revision.version; // Tăng version
    liveCourse.status = 'published'; // Đảm bảo vẫn published

    await liveCourse.save();

    // Cập nhật Revision
    revision.status = 'approved';
    await revision.save();

    resultCourse = liveCourse;
  }

  // --- GENERATE EMBEDDING ---
  try {
    const textToEmbed = `${resultCourse.title}. ${resultCourse.shortDescription}. ${resultCourse.description}`;
    const embedding = await generateCourseEmbedding(textToEmbed);
    if (embedding && embedding.length > 0) {
      resultCourse.embedding = embedding;
      await resultCourse.save();
    }
  } catch (error) {
    console.error("Error generating embedding during approval:", error);
  }

  // ✅ Fix Bug 3: Cleanup - Archive tất cả revision còn lại của cùng instructor/course
  // Tránh tình trạng duplicate revisions cũ vẫn hiển thị changes_requested/rejected
  const cleanupFilter = {
    instructor: revision.instructor,
    _id: { $ne: revision._id }, // Không xóa revision vừa approved
    status: { $in: ['draft', 'rejected', 'changes_requested'] }
  };
  if (revision.course) {
    cleanupFilter.course = revision.course; // Chỉ cleanup revisions của cùng course
  } else {
    cleanupFilter.course = null; // Fresh draft: cleanup các draft cũ của cùng slug
    cleanupFilter['data.slug'] = revision.data.slug;
  }
  await CourseRevision.updateMany(cleanupFilter, { $set: { status: 'archived' } });

  // Sau khi duyệt thành công, gửi thông báo cho instructor
  await notificationService.createNotification({
    recipient: revision.instructor,
    sender: adminId,
    type: "system",
    title: "Khóa học đã được duyệt",
    message: `Khóa học "${revision.data.title}" của bạn đã được admin duyệt.`,
    metadata: {
      courseId: revision._id,
      courseSlug: revision.data.slug || undefined,
      url: '/instructor/courses'
    }
  });

  return {
    message: "Khóa học đã được duyệt thành công!",
    course: resultCourse
  };
};

/**
 * Từ chối khóa học (Reject)
 */
export const rejectRevision = async (revisionId, reviewMessage, adminId) => {
  const revision = await CourseRevision.findById(revisionId);

  if (!revision) {
    const error = new Error("Không tìm thấy bản revision.");
    error.statusCode = 404;
    throw error;
  }

  // ✅ Fix: Cho phép reject từ cả 'pending' và 'changes_requested'
  if (!['pending', 'changes_requested'].includes(revision.status)) {
    const error = new Error("Chỉ có thể từ chối các khóa học đang ở trạng thái Pending hoặc Changes Requested.");
    error.statusCode = 400;
    throw error;
  }

  // Cập nhật status thành rejected và lưu message
  revision.status = 'rejected';
  revision.reviewMessage = reviewMessage;
  await revision.save();

  // Gửi thông báo cho instructor khi bị từ chối
  await notificationService.createNotification({
    recipient: revision.instructor,
    sender: adminId,
    type: "system",
    title: "Khóa học bị từ chối",
    message: `Khóa học "${revision.data.title}" của bạn đã bị từ chối. Lý do: ${reviewMessage}`,
    metadata: {
      courseId: revision._id,
      courseSlug: revision.data.slug || undefined,
      url: '/instructor/courses'
    }
  });

  return {
    message: "Khóa học đã bị từ chối. Instructor có thể chỉnh sửa và submit lại."
  };
};


/**
 * CASE 3: Yêu cầu Instructor sửa (changes_requested)
 * Khác với reject: Instructor vẫn có thể mở lại bản draft và submit lại
 * Status: pending → changes_requested
 */
export const requestRevisionChanges = async (revisionId, reviewMessage, adminId) => {
  if (!reviewMessage || !reviewMessage.trim()) {
    const error = new Error('Vui lòng cung cấp phản hồi chi tiết cho instructor.');
    error.statusCode = 400;
    throw error;
  }

  const revision = await CourseRevision.findById(revisionId);

  if (!revision) {
    const error = new Error('Không tìm thấy bản revision.');
    error.statusCode = 404;
    throw error;
  }

  if (revision.status !== 'pending') {
    const error = new Error('Chỉ có thể yêu cầu sửa các khóa học đang ở trạng thái Pending.');
    error.statusCode = 400;
    throw error;
  }

  // Lưu lịch sử phản hồi
  revision.reviewHistory = revision.reviewHistory || [];
  revision.reviewHistory.push({
    message: reviewMessage,
    action: 'changes_requested',
    adminId,
    createdAt: new Date()
  });

  revision.status = 'changes_requested';
  revision.reviewMessage = reviewMessage;
  await revision.save();

  // Gửi thông báo cho instructor
  await notificationService.createNotification({
    recipient: revision.instructor,
    sender: adminId,
    type: 'system',
    title: '⚠️ Khóa học cần chỉnh sửa',
    message: `Khóa học "${revision.data.title}" cần chỉnh sửa trước khi được duyệt. Phản hồi: ${reviewMessage}`,
    metadata: {
      courseId: revision._id,
      courseSlug: revision.data.slug || undefined,
      url: '/instructor/courses'
    }
  });

  return {
    message: 'Đã gửi yêu cầu sửa đổi đến instructor.',
    revisionId: revision._id
  };
};

/**
 * CASE 7: Unpublish khóa học (Admin hoặc Instructor)
 * published → unpublished
 * Học viên cũ vẫn có thể xem
 */
export const unpublishCourse = async (courseId, adminId, reason = '') => {
  const course = await Course.findById(courseId);

  if (!course) {
    const error = new Error('Không tìm thấy khóa học.');
    error.statusCode = 404;
    throw error;
  }

  if (!['published', 'hidden'].includes(course.status)) {
    const error = new Error('Chỉ có thể unpublish khóa học đang ở trạng thái published hoặc hidden.');
    error.statusCode = 400;
    throw error;
  }

  course.status = 'unpublished';
  await course.save();

  // Gửi thông báo cho instructor
  await notificationService.createNotification({
    recipient: course.instructor,
    sender: adminId,
    type: 'system',
    title: 'Khóa học đã bị ẩn khỏi marketplace',
    message: `Khóa học "${course.title}" đã bị admin unpublish.${reason ? ` Lý do: ${reason}` : ''} Học viên hiện tại vẫn có thể truy cập.`,
    metadata: {
      courseId: course._id,
      courseSlug: course.slug,
      url: '/instructor/courses'
    }
  });

  return {
    message: 'Đã unpublish khóa học. Học viên hiện tại vẫn có thể truy cập.'
  };
};

/**
 * CASE 8: Suspend khóa học (Admin đình chỉ - vi phạm chính sách)
 * published/unpublished → suspended
 * Học viên không thể xem, không cấp signed URL
 */
export const suspendCourse = async (courseId, adminId, reason) => {
  if (!reason || !reason.trim()) {
    const error = new Error('Vui lòng cung cấp lý do đình chỉ khóa học.');
    error.statusCode = 400;
    throw error;
  }

  const course = await Course.findById(courseId);

  if (!course) {
    const error = new Error('Không tìm thấy khóa học.');
    error.statusCode = 404;
    throw error;
  }

  if (course.status === 'suspended') {
    const error = new Error('Khóa học đã bị đình chỉ trước đó.');
    error.statusCode = 400;
    throw error;
  }

  const previousStatus = course.status;
  course.status = 'suspended';
  course.suspendReason = reason;
  await course.save();

  // Gửi thông báo nghiêm túc cho instructor
  await notificationService.createNotification({
    recipient: course.instructor,
    sender: adminId,
    type: 'system',
    title: 'Khóa học bị đình chỉ vi phạm chính sách',
    message: `Khóa học "${course.title}" đã bị đình chỉ. Lý do: ${reason}. Vui lòng liên hệ Admin để được hỗ trợ.`,
    metadata: {
      courseId: course._id,
      courseSlug: course.slug,
      url: '/instructor/courses'
    }
  });

  return {
    message: `Đã đình chỉ khóa học. Trạng thái trước: ${previousStatus}.`,
    previousStatus
  };
};

/**
 * Restore khóa học từ suspended → unpublished (Admin review lại)
 */
export const restoreSuspendedCourse = async (courseId, adminId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error('Không tìm thấy khóa học.');
    error.statusCode = 404;
    throw error;
  }

  if (course.status !== 'suspended') {
    const error = new Error('Khóa học không ở trạng thái suspended.');
    error.statusCode = 400;
    throw error;
  }

  course.status = 'unpublished'; // Restore về unpublished để admin/instructor publish lại thủ công
  course.suspendReason = null;
  await course.save();

  await notificationService.createNotification({
    recipient: course.instructor,
    sender: adminId,
    type: 'system',
    title: 'Khóa học đã được khôi phục',
    message: `Khóa học "${course.title}" đã được admin khôi phục về trạng thái Unpublished. Bạn có thể liên hệ Admin để publish lại.`,
    metadata: {
      courseId: course._id,
      courseSlug: course.slug,
      url: '/instructor/courses'
    }
  });

  return { message: 'Đã khôi phục khóa học về trạng thái Unpublished.' };
};

/**
 * Publish lại khóa học từ unpublished → published (Admin)
 * Dùng khi Admin muốn đưa khóa học đã ẩn trở lại marketplace
 */
export const republishCourse = async (courseId, adminId) => {
  const course = await Course.findById(courseId);

  if (!course) {
    const error = new Error('Không tìm thấy khóa học.');
    error.statusCode = 404;
    throw error;
  }

  if (course.status !== 'unpublished') {
    const error = new Error('Chỉ có thể publish lại khóa học đang ở trạng thái Unpublished.');
    error.statusCode = 400;
    throw error;
  }

  course.status = 'published';
  await course.save();

  // Thông báo cho instructor
  await notificationService.createNotification({
    recipient: course.instructor,
    sender: adminId,
    type: 'system',
    title: 'Khóa học đã được publish lại',
    message: `Khóa học "${course.title}" đã được admin hiển thị lại trên marketplace. Học viên mới có thể tiếp tục đăng ký.`,
    metadata: {
      courseId: course._id,
      courseSlug: course.slug,
      url: '/instructor/courses'
    }
  });

  return { message: 'Đã publish lại khóa học thành công.' };
};

export const getAllInstructors = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || '';
  const skip = (page - 1) * limit;

  const filter = { role: 'instructor' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const instructors = await User.find(filter)
    .select('name email avatar phone createdAt isActive bio expertise')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalInstructors = await User.countDocuments(filter);

  const instructorsWithStats = await Promise.all(
    instructors.map(async (inst) => {
      const coursesCount = await Course.countDocuments({ instructor: inst._id, status: 'published' });
      const courses = await Course.find({ instructor: inst._id }).select('studentsCount');
      const totalStudents = courses.reduce((acc, curr) => acc + (curr.studentsCount || 0), 0);

      return {
        ...inst,
        stats: {
          courses: coursesCount,
          students: totalStudents
        }
      };
    })
  );

  return {
    instructors: instructorsWithStats,
    pagination: {
      total: totalInstructors,
      page,
      limit,
      totalPages: Math.ceil(totalInstructors / limit)
    }
  };
};

export const toggleBlockUser = async (userId, reason) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Không tìm thấy người dùng.');
  if (user.role === 'admin') throw new Error('Không thể khóa Admin.');

  const willBan = user.isActive;

  if (willBan) {
    if (!reason) throw new Error('Vui lòng cung cấp lý do khóa tài khoản.');
    user.isActive = false;
    user.banReason = reason;
  } else {
    user.isActive = true;
    user.banReason = null;
  }

  await user.save();

  return {
    message: willBan ? `Đã khóa tài khoản. Lý do: ${reason}` : 'Đã mở khóa tài khoản.',
    isActive: user.isActive,
    banReason: user.banReason
  };
};

/**
 * Get list of instructor applications
 */
export const getInstructorApplications = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = query.status || 'pending';

  const filter = {};
  if (status !== 'all') {
    filter.status = status;
  }

  const applications = await InstructorApplication.find(filter)
    .populate('user', 'name email avatar') // Get user info
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await InstructorApplication.countDocuments(filter);

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Review application (Approve/Reject)
 */
export const reviewInstructorApplication = async (applicationId, action, reason) => {
  const application = await InstructorApplication.findById(applicationId).populate('user');
  if (!application) throw new Error("Application not found");

  if (application.status !== 'pending') throw new Error("Application has already been processed");

  if (action === 'approve') {
    // 1. Update Application status
    application.status = 'approved';
    await application.save();

    // 2. Update User role
    const user = application.user;
    user.role = 'instructor';
    await user.save();

    // 3. Create Instructor Profile (IMPORTANT)
    // Check if profile exists to avoid duplicates
    let profile = await InstructorProfile.findOne({ user: user._id });
    if (!profile) {
      await InstructorProfile.create({
        user: user._id,
        headline: "New Instructor", // Default headline
        experience: application.experience,
        specialties: application.intendedTopics,
        // You can add more fields mapped from application here
      });
    }

    // 4. Gửi thông báo cho user được duyệt
    await notificationService.createNotification({
      recipient: user._id,
      type: "system",
      title: "Hồ sơ giảng viên được duyệt",
      message: "Chúc mừng! Yêu cầu trở thành giảng viên của bạn đã được phê duyệt. Bạn có thể bắt đầu tạo khóa học ngay bây giờ.",
      metadata: { url: "/instructor/dashboard" }
    }).catch(err => console.error("Lỗi gửi thông báo approve:", err));

    return { message: "Approved successfully. User is now an Instructor." };
  }

  if (action === 'reject') {
    if (!reason) throw new Error("Rejection reason is required");

    application.status = 'rejected';
    application.rejectionReason = reason;
    await application.save();

    // Gửi thông báo cho user bị từ chối
    await notificationService.createNotification({
      recipient: application.user._id,
      type: "system",
      title: "Hồ sơ giảng viên bị từ chối",
      message: `Rất tiếc, yêu cầu trở thành giảng viên của bạn đã bị từ chối.${reason ? `\n\nLý do: ${reason}` : ""}`,
      metadata: { adminNote: reason, url: "/profile/become-instructor" }
    }).catch(err => console.error("Lỗi gửi thông báo reject:", err));

    return { message: "Application rejected." };
  }

  throw new Error("Invalid action");
};

// ─── getQuizzesPreview — Admin xem tất cả Quiz trong khóa học ────────────────
/**
 * Lấy preview toàn bộ quiz của một khóa học (theo course._id)
 * Dùng để admin kiểm duyệt nội dung trước khi approve revision
 */
export const getQuizzesPreview = async (courseId) => {
  const course = await Course.findById(courseId)
    .populate({
      path: 'sections',
      populate: {
        path: 'lectures',
        select: 'title quizzes duration order',
      },
    })
    .lean();

  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.statusCode = 404;
    throw error;
  }

  let totalQuizzes = 0;
  let lecturesWithQuiz = 0;

  const sections = (course.sections || []).map(section => ({
    sectionTitle: section.title,
    lectures: (section.lectures || []).map(lecture => {
      const activeQuizzes = (lecture.quizzes || []).filter(q => q.isActive !== false);
      if (activeQuizzes.length > 0) lecturesWithQuiz++;
      totalQuizzes += activeQuizzes.length;

      return {
        lectureId: lecture._id,
        lectureTitle: lecture.title,
        duration: lecture.duration,
        quizzes: activeQuizzes.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer, // Admin được phép xem đáp án đúng
          hint: q.hint,
          timestamp: q.timestamp,
          isActive: q.isActive,
        })),
      };
    }),
  }));

  return {
    courseTitle: course.title,
    sections,
    stats: {
      totalQuizzes,
      lecturesWithQuiz,
      avgQuizPerLecture: lecturesWithQuiz > 0
        ? parseFloat((totalQuizzes / lecturesWithQuiz).toFixed(1))
        : 0,
    },
  };
};

export const getProgressScheduleStats = async () => {
  const progressCounts = await Progress.aggregate([
    {
      $group: {
        _id: '$scheduleStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const distribution = {
    inProgress: 0,
    behind: 0,
    completed: 0
  };
  progressCounts.forEach(item => {
    if (item._id === 'in-progress') distribution.inProgress = item.count;
    else if (item._id === 'behind') distribution.behind = item.count;
    else if (item._id === 'completed') distribution.completed = item.count;
  });

  const topBehindCourses = await Progress.aggregate([
    {
      $group: {
        _id: '$course',
        totalStudents: { $sum: 1 },
        behindStudents: {
          $sum: {
            $cond: [{ $eq: ['$scheduleStatus', 'behind'] }, 1, 0]
          }
        }
      }
    },
    { $match: { totalStudents: { $gt: 2 } } }, // Có ít nhất 3 học viên để tránh nhiễu
    {
      $addFields: {
        behindRate: { $multiply: [{ $divide: ['$behindStudents', '$totalStudents'] }, 100] }
      }
    },
    { $sort: { behindRate: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    { $unwind: '$courseInfo' },
    {
      $lookup: {
        from: 'users',
        localField: 'courseInfo.instructor',
        foreignField: '_id',
        as: 'instructorInfo'
      }
    },
    {
      $project: {
        _id: 1,
        title: '$courseInfo.title',
        slug: '$courseInfo.slug',
        thumbnail: '$courseInfo.thumbnail',
        behindRate: 1,
        totalStudents: 1,
        behindStudents: 1,
        instructorName: { $arrayElemAt: ['$instructorInfo.name', 0] }
      }
    }
  ]);

  topBehindCourses.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  return {
    distribution,
    topBehindCourses
  };
};

