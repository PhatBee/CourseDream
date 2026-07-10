import Course from "../course/course.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import InstructorProfile from "../user/InstructorProfile.model.js";
import Progress from "../progress/progress.model.js";
import CourseRevision from "../course/courseRevision.model.js";
import Category from "../category/category.model.js";
import Lecture from "../course/lecture.model.js";
import Section from "../course/section.model.js";
import User from "../auth/auth.model.js";
import notificationService from "../notification/notification.service.js";
import { uploadToCloudinary } from "../../config/cloudinary.js";
import slugify from "slugify";
import mongoose from "mongoose";
import { signThumbnailUrl } from '../../config/aws.js';

const parseArrayField = (fieldData) => {
  if (!fieldData) return [];
  if (Array.isArray(fieldData)) return fieldData;
  return [fieldData];
};

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
 * Lấy thông tin chi tiết Instructor Profile
 */
export const getInstructorProfile = async (userId) => {
  let profile = await InstructorProfile.findOne({ user: userId });

  // Nếu chưa có (trường hợp hiếm), tạo mới mặc định
  if (!profile) {
    profile = await InstructorProfile.create({ user: userId });
  }
  return profile;
};

/**
 * Cập nhật Instructor Profile
 */
export const updateInstructorProfile = async (userId, data) => {
  const profile = await InstructorProfile.findOneAndUpdate(
    { user: userId },
    { $set: data },
    { new: true, upsert: true } // Trả về data mới, nếu chưa có thì tạo
  );
  return profile;
};

export const getInstructorDashboardStats = async (instructorId, timeRange = '30days') => {
  // 1. Lấy danh sách khóa học của giảng viên
  const instructorCourses = await Course.find({ instructor: instructorId }).lean();
  const courseIds = instructorCourses.map(c => c._id);
  const totalCourses = instructorCourses.length;

  // Điểm đánh giá trung bình của tất cả khóa học
  const averageRating = totalCourses > 0
    ? (instructorCourses.reduce((acc, course) => acc + (course.rating || 0), 0) / totalCourses)
    : 0;

  // Tổng số học viên thực tế của các khóa học
  const totalStudents = instructorCourses.reduce((acc, course) => acc + (course.studentsCount || 0), 0);

  // 2. Xác định các mốc thời gian dựa trên bộ lọc
  const now = new Date();
  let currentPeriodStart;
  let previousPeriodStart;
  let previousPeriodEnd;
  let groupByFormat;
  let gapFillStep;

  if (timeRange === '7days') {
    currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    previousPeriodEnd = currentPeriodStart;
    groupByFormat = '%Y-%m-%d';
    gapFillStep = 'day';
  } else if (timeRange === '30days') {
    currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    previousPeriodEnd = currentPeriodStart;
    groupByFormat = '%Y-%m-%d';
    gapFillStep = 'day';
  } else {
    // 'all' - Toàn thời gian
    currentPeriodStart = new Date(0); // Từ lúc bắt đầu hệ thống
    previousPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Dùng 30 ngày trước làm đối chuẩn so sánh tăng trưởng
    previousPeriodEnd = now;
    groupByFormat = '%Y-%m';
    gapFillStep = 'month';
  }

  // Mốc thời gian bắt đầu để tính toán tăng trưởng
  const kpiGrowthStart = timeRange === 'all' ? new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) : previousPeriodStart;
  const kpiGrowthCurrentStart = timeRange === 'all' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : currentPeriodStart;
  const kpiGrowthPreviousEnd = timeRange === 'all' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : previousPeriodEnd;

  // 3. Chạy Aggregation Pipeline trên Enrollment để tính KPI Doanh thu và Ghi danh
  const kpiStats = await Enrollment.aggregate([
    {
      $match: {
        course: { $in: courseIds }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    {
      $unwind: '$courseDetails'
    },
    {
      $project: {
        enrolledAt: 1,
        price: {
          $convert: {
            input: { $ifNull: ['$courseDetails.priceDiscount', { $ifNull: ['$courseDetails.price', 0] }] },
            to: 'double',
            onError: 0,
            onNull: 0
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        // Dữ liệu toàn thời gian
        allTimeRevenue: { $sum: '$price' },
        allTimeEnrollments: { $sum: 1 },
        // Dữ liệu chu kỳ hiện tại
        currentRevenue: {
          $sum: {
            $cond: [
              { $gte: ['$enrolledAt', kpiGrowthCurrentStart] },
              '$price',
              0
            ]
          }
        },
        // Dữ liệu chu kỳ trước
        previousRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$enrolledAt', kpiGrowthStart] },
                  { $lt: ['$enrolledAt', kpiGrowthPreviousEnd] }
                ]
              },
              '$price',
              0
            ]
          }
        },
        currentEnrollments: {
          $sum: {
            $cond: [
              { $gte: ['$enrolledAt', kpiGrowthCurrentStart] },
              1,
              0
            ]
          }
        },
        previousEnrollments: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ['$enrolledAt', kpiGrowthStart] },
                  { $lt: ['$enrolledAt', kpiGrowthPreviousEnd] }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  const kpi = kpiStats[0] || {
    allTimeRevenue: 0,
    allTimeEnrollments: 0,
    currentRevenue: 0,
    previousRevenue: 0,
    currentEnrollments: 0,
    previousEnrollments: 0
  };

  // Xác định số liệu chính hiển thị trên card dựa vào timeRange
  const finalRevenue = timeRange === 'all' ? kpi.allTimeRevenue : kpi.currentRevenue;
  const finalEnrollments = timeRange === 'all' ? kpi.allTimeEnrollments : kpi.currentEnrollments;

  // Tính tỷ lệ tăng trưởng doanh thu và ghi danh
  const revGrowth = kpi.previousRevenue > 0
    ? ((kpi.currentRevenue - kpi.previousRevenue) / kpi.previousRevenue) * 100
    : 0;

  const enrollGrowth = kpi.previousEnrollments > 0
    ? ((kpi.currentEnrollments - kpi.previousEnrollments) / kpi.previousEnrollments) * 100
    : 0;

  // Tính tỷ lệ chuyển đổi (mock page views dựa trên enrollments)
  const currentViews = finalEnrollments * 18 + 120;
  const currentConversionRate = currentViews > 0 ? (finalEnrollments / currentViews) * 100 : 0;

  const prevEnrollmentsVal = timeRange === 'all' ? kpi.currentEnrollments : kpi.previousEnrollments;
  const prevViews = prevEnrollmentsVal * 18 + 120;
  const prevConversionRate = prevViews > 0 ? (prevEnrollmentsVal / prevViews) * 100 : 0;

  const conversionGrowth = prevConversionRate > 0
    ? ((currentConversionRate - prevConversionRate) / prevConversionRate) * 100
    : 0;

  // 4. Lấy dữ liệu biểu đồ xu hướng (Trend Chart Data)
  const chartStart = timeRange === 'all'
    ? new Date(now.getFullYear() - 1, now.getMonth(), 1) // default 12 tháng qua để biểu đồ gọn đẹp
    : currentPeriodStart;

  const trendStats = await Enrollment.aggregate([
    {
      $match: {
        course: { $in: courseIds },
        enrolledAt: { $gte: chartStart }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    {
      $unwind: '$courseDetails'
    },
    {
      $project: {
        enrolledAt: 1,
        price: {
          $convert: {
            input: { $ifNull: ['$courseDetails.priceDiscount', { $ifNull: ['$courseDetails.price', 0] }] },
            to: 'double',
            onError: 0,
            onNull: 0
          }
        }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupByFormat,
            date: '$enrolledAt',
            timezone: 'Asia/Ho_Chi_Minh'
          }
        },
        revenue: { $sum: '$price' },
        enrollments: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Điền đầy đủ các khoảng trống ngày/tháng để biểu đồ không bị gãy nét
  const chartData = [];
  const trendMap = new Map(trendStats.map(item => [item._id, item]));

  if (gapFillStep === 'day') {
    const daysCount = timeRange === '7days' ? 7 : 30;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${date}`;

      const existing = trendMap.get(dateKey);
      chartData.push({
        date: `${date}/${month}`, // hiển thị dạng DD/MM cho đẹp
        revenue: existing ? existing.revenue : 0,
        enrollments: existing ? existing.enrollments : 0
      });
    }
  } else {
    // Gộp theo tháng (12 tháng qua)
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      const existing = trendMap.get(monthKey);
      chartData.push({
        date: `${month}/${year}`, // hiển thị dạng MM/YYYY
        revenue: existing ? existing.revenue : 0,
        enrollments: existing ? existing.enrollments : 0
      });
    }
  }

  // 5. Bảng hiệu suất chi tiết các khóa học (Course Performance Table)
  const coursePerformance = await Course.aggregate([
    {
      $match: { instructor: new mongoose.Types.ObjectId(instructorId) }
    },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'course',
        as: 'enrollments'
      }
    },
    {
      $lookup: {
        from: 'progresses',
        localField: '_id',
        foreignField: 'course',
        as: 'progressDocs'
      }
    },
    {
      $project: {
        title: 1,
        slug: 1,
        thumbnail: 1,
        status: 1,
        price: 1,
        priceDiscount: 1,
        rating: 1,
        periodEnrollments: {
          $filter: {
            input: '$enrollments',
            as: 'e',
            cond: { $gte: ['$$e.enrolledAt', kpiGrowthCurrentStart] }
          }
        },
        totalEnrollmentsCount: { $size: '$enrollments' },
        behindStudentsCount: {
          $size: {
            $filter: {
              input: '$progressDocs',
              as: 'p',
              cond: { $eq: ['$$p.scheduleStatus', 'behind'] }
            }
          }
        },
        completedStudentsCount: {
          $size: {
            $filter: {
              input: '$progressDocs',
              as: 'p',
              cond: { $eq: ['$$p.scheduleStatus', 'completed'] }
            }
          }
        },
        avgCompletionPercentage: { $ifNull: [{ $avg: '$progressDocs.percentage' }, 0] }
      }
    },
    {
      $project: {
        title: 1,
        slug: 1,
        thumbnail: 1,
        status: 1,
        price: 1,
        priceDiscount: 1,
        rating: 1,
        studentsCount: '$totalEnrollmentsCount',
        periodStudentsCount: { $size: '$periodEnrollments' },
        behindStudentsCount: 1,
        completedStudentsCount: 1,
        avgCompletionPercentage: 1,
        revenue: {
          $multiply: [
            '$totalEnrollmentsCount',
            {
              $convert: {
                input: { $ifNull: ['$priceDiscount', { $ifNull: ['$price', 0] }] },
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          ]
        },
        periodRevenue: {
          $multiply: [
            { $size: '$periodEnrollments' },
            {
              $convert: {
                input: { $ifNull: ['$priceDiscount', { $ifNull: ['$price', 0] }] },
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          ]
        }
      }
    },
    {
      $sort: { revenue: -1 }
    }
  ]);

  // Lấy danh sách khóa học gần đây
  const recentCourses = await Course.find({ instructor: instructorId })
    .sort({ updatedAt: -1 })
    .limit(3)
    .select('title slug thumbnail status studentsCount price createdAt')
    .lean();

  recentCourses.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  coursePerformance.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  return {
    stats: {
      totalCourses,
      totalStudents,
      rating: averageRating,
      revenue: finalRevenue,
      enrollments: finalEnrollments,
      conversionRate: currentConversionRate,
      growth: {
        revenue: revGrowth,
        enrollments: enrollGrowth,
        conversion: conversionGrowth
      }
    },
    recentCourses,
    chartData,
    coursePerformance
  };
};

/**
 * Lấy danh sách học viên đã enrolled của một khóa học
 */
export const getCourseStudents = async (courseId, instructorId, { page = 1, limit = 10, scheduleStatus } = {}) => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId });
  if (!course) {
    const err = new Error("Không tìm thấy khóa học hoặc bạn không có quyền xem thông tin khóa học này.");
    err.status = 403;
    throw err;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skipNum = (pageNum - 1) * limitNum;

  let enrollmentQuery = { course: courseId };
  let progresses = [];
  
  if (scheduleStatus) {
    // Lấy progress thỏa mãn trạng thái trước
    const progressDocs = await Progress.find({
      course: courseId,
      scheduleStatus: scheduleStatus
    }).select('student percentage scheduleStatus updatedAt').lean();
    
    const studentIds = progressDocs.map(p => p.student.toString());
    enrollmentQuery.student = { $in: studentIds };
    progresses = progressDocs;
  }

  const totalItems = await Enrollment.countDocuments(enrollmentQuery);
  const enrollments = await Enrollment.find(enrollmentQuery)
    .populate("student", "name avatar email")
    .sort({ enrolledAt: -1 })
    .skip(skipNum)
    .limit(limitNum)
    .lean();

  // Nếu không filter status ở trên, fetch progress cho các student đã phân trang
  if (!scheduleStatus) {
    const studentIds = enrollments.map(e => e.student?._id).filter(id => !!id);
    progresses = await Progress.find({
      course: courseId,
      student: { $in: studentIds }
    }).lean();
  }

  const studentsData = enrollments.map(e => {
    const studentProgress = e.student
      ? progresses.find(p => p.student.toString() === e.student._id.toString())
      : null;
    return {
      student: e.student,
      enrolledAt: e.enrolledAt,
      progress: studentProgress ? {
        percentage: studentProgress.percentage || 0,
        scheduleStatus: studentProgress.scheduleStatus || 'in-progress',
        updatedAt: studentProgress.updatedAt || e.lastViewedAt || e.enrolledAt
      } : {
        percentage: 0,
        scheduleStatus: 'in-progress',
        updatedAt: e.lastViewedAt || e.enrolledAt
      }
    };
  });

  return {
    students: studentsData,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages: Math.ceil(totalItems / limitNum)
    }
  };
};

/**
 * Lấy danh sách khóa học của Instructor (có phân trang & lọc)
 */
export const getInstructorCourses = async (instructorId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 9;
  const statusFilter = query.status;

  // 1. Lấy tất cả Course (mọi status)
  const courses = await Course.find({ instructor: instructorId })
    .select('title slug thumbnail price priceDiscount level rating studentsCount status totalLectures totalHours createdAt publishedVersionNo suspendReason')
    .lean();

  // 2. Lấy tất cả Revision đang "active" (chưa approved / archived)
  const allRevisions = await CourseRevision.find({
    instructor: instructorId,
    status: { $in: ['draft', 'pending', 'changes_requested', 'rejected'] }
  }).lean();

  const mergedList = [];

  // A. Courses chính thức (đã có trong Course collection)
  courses.forEach(course => {
    const activeRevision = allRevisions.find(r => r.course && r.course.toString() === course._id.toString());

    mergedList.push({
      ...course,
      revisionStatus: activeRevision ? activeRevision.status : null,
      revisionId: activeRevision?._id || null,
      reviewMessage: activeRevision?.reviewMessage || null,
      reviewHistory: activeRevision?.reviewHistory || [],
      type: 'course'
    });
  });

  // B. Standalone Revisions (Course mới chưa từng publish - course = null)
  const standaloneRevisions = allRevisions.filter(r => !r.course);
  standaloneRevisions.forEach(rev => {
    mergedList.push({
      _id: rev._id,
      title: rev.data.title || 'Untitled Course',
      slug: rev.data.slug,
      thumbnail: rev.data.thumbnail,
      price: rev.data.price || 0,
      priceDiscount: rev.data.priceDiscount,
      totalLectures: (rev.data.sections || []).reduce((acc, s) => acc + (s.lectures?.length || 0), 0),
      totalHours: 0,
      status: rev.status, // draft | pending | changes_requested | rejected
      revisionStatus: null,
      revisionId: rev._id,
      reviewMessage: rev.reviewMessage || null,
      reviewHistory: rev.reviewHistory || [],
      type: 'revision',
      createdAt: rev.createdAt
    });
  });

  // --- FILTER ---
  let finalCourses = mergedList;
  if (statusFilter && statusFilter !== 'all') {
    finalCourses = finalCourses.filter(c => {
      if (statusFilter === 'pending') return c.status === 'pending' || c.revisionStatus === 'pending';
      if (statusFilter === 'rejected') return c.status === 'rejected' || c.revisionStatus === 'rejected';
      if (statusFilter === 'changes_requested') return c.status === 'changes_requested' || c.revisionStatus === 'changes_requested';
      return c.status === statusFilter;
    });
  }

  // --- STATS (đầy đủ 8 trường hợp) ---
  const stats = {
    all: 0, published: 0, pending: 0, changes_requested: 0,
    draft: 0, hidden: 0, archived: 0, rejected: 0, unpublished: 0, suspended: 0
  };
  mergedList.forEach(c => {
    stats.all++;
    // Ưu tiên revision status nếu là pending/changes_requested/rejected
    const effectiveStatus = c.revisionStatus || c.status;
    if (effectiveStatus === 'pending') stats.pending++;
    else if (effectiveStatus === 'changes_requested') stats.changes_requested++;
    else if (effectiveStatus === 'rejected') stats.rejected++;
    else if (c.status === 'draft') stats.draft++;
    else if (c.status === 'published') stats.published++;
    else if (c.status === 'hidden') stats.hidden++;
    else if (c.status === 'archived') stats.archived++;
    else if (c.status === 'unpublished') stats.unpublished++;
    else if (c.status === 'suspended') stats.suspended++;
  });

  // --- SORT & PAGINATE ---
  finalCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = finalCourses.length;
  const paginatedData = finalCourses.slice((page - 1) * limit, page * limit);

  paginatedData.forEach(c => {
    if (c.thumbnail) c.thumbnail = signThumbnailUrl(c.thumbnail);
  });

  return {
    courses: paginatedData,
    stats,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
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

    // Tìm xem có bản Revision nào đang treo (draft/pending/rejected/changes_requested) của course này không
    const existingRevision = await CourseRevision.findOne({
      course: liveCourse._id,
      status: { $in: ['draft', 'pending', 'rejected', 'changes_requested'] }
    }).lean();

    // CASE 3: Đang Pending -> Chặn
    if (existingRevision && existingRevision.status === 'pending') {
      const error = new Error("Khóa học đang chờ duyệt, không thể chỉnh sửa.");
      error.statusCode = 400;
      throw error;
    }

    // CASE 2.1.1: Đã có bản Draft -> Trả về bản Draft để edit tiếp
    if (existingRevision && existingRevision.status === 'draft') {
      return signCourseResources({
        ...existingRevision.data, // Bung dữ liệu trong field 'data' ra
        thumbnail: signThumbnailUrl(existingRevision.data.thumbnail),
        _id: existingRevision._id, // ID của revision
        courseId: liveCourse._id,  // ID của course gốc
        status: 'draft',
        reviewMessage: existingRevision.reviewMessage || null,
        isUpdateMode: true // Cờ báo frontend đây là update course cũ
      });
    }

    // CASE 2.1.2: Có bản Rejected -> Cho phép edit lại
    if (existingRevision && existingRevision.status === 'rejected') {
      return signCourseResources({
        ...existingRevision.data,
        thumbnail: signThumbnailUrl(existingRevision.data.thumbnail),
        _id: existingRevision._id,
        courseId: liveCourse._id,
        status: 'rejected',
        reviewMessage: existingRevision.reviewMessage || null,
        reviewHistory: existingRevision.reviewHistory || [],
        isUpdateMode: true
      });
    }

    // CASE 2.1.3: changes_requested -> Cho phép edit và resubmit
    if (existingRevision && existingRevision.status === 'changes_requested') {
      return signCourseResources({
        ...existingRevision.data,
        thumbnail: signThumbnailUrl(existingRevision.data.thumbnail),
        _id: existingRevision._id,
        courseId: liveCourse._id,
        status: 'changes_requested',
        reviewMessage: existingRevision.reviewMessage || null,
        reviewHistory: existingRevision.reviewHistory || [],
        isUpdateMode: true
      });
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
        resources: (lec.resources || []).map(res => ({
          title: res.title,
          url: signThumbnailUrl(res.url),
          type: res.type
        })),
        // ✅ FIX: Clone quizzes khi lần đầu edit course đã publish
        quizzes: (lec.quizzes || []).map(q => ({
          question: q.question || '',
          options: (q.options || []).map(o => ({ id: o.id, text: o.text || '' })),
          correctAnswer: q.correctAnswer || 'A',
          hint: q.hint || '',
          timestamp: Number(q.timestamp) || 0,
          isActive: q.isActive !== false,
        }))
      }))
    }));


    return signCourseResources({
      title: populatedCourse.title,
      slug: populatedCourse.slug, // Giữ slug cũ
      thumbnail: signThumbnailUrl(populatedCourse.thumbnail),
      previewUrl: populatedCourse.previewUrl,
      shortDescription: populatedCourse.shortDescription,
      description: populatedCourse.description,
      price: populatedCourse.price,
      priceDiscount: populatedCourse.priceDiscount,
      durationInWeeks: populatedCourse.durationInWeeks,
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
    });
  }

  // --- TRƯỜNG HỢP 1: Course chưa từng publish (Fresh Draft) ---

  // ✨ LOGIC: Tìm revision bằng slug (ưu tiên) hoặc _id (fallback cho legacy)
  // Slug format: "ten-khoa-hoc-1234567890" (có timestamp)

  const isObjectId = mongoose.Types.ObjectId.isValid(slug) && slug.length === 24;

  let freshDraft;
  if (isObjectId) {
    // Fallback: Tìm bằng _id của revision (legacy support)
    freshDraft = await CourseRevision.findOne({
      _id: slug,
      instructor: instructorId,
      course: null,
      status: 'draft'
    }).lean();
  } else {
    // ✨ Tìm bằng slug trong data.slug (cách chính thức)
    freshDraft = await CourseRevision.findOne({
      'data.slug': slug,
      instructor: instructorId,
      course: null,
      status: 'draft'
    }).lean();
  }

  if (freshDraft) {
    return signCourseResources({
      ...freshDraft.data,
      thumbnail: signThumbnailUrl(freshDraft.data?.thumbnail),
      _id: freshDraft._id,
      revisionId: freshDraft._id, // ✨ Thêm revisionId để frontend gửi lại khi save
      status: 'draft',
      isUpdateMode: false
    });
  }

  // Nếu pending (Fresh Pending) -> Chặn
  let freshPending;
  if (isObjectId) {
    freshPending = await CourseRevision.findOne({
      _id: slug,
      instructor: instructorId,
      course: null,
      status: 'pending'
    });
  } else {
    freshPending = await CourseRevision.findOne({
      'data.slug': slug,
      instructor: instructorId,
      course: null,
      status: 'pending'
    });
  }

  if (freshPending) {
    const error = new Error("Khóa học đang chờ duyệt, không thể chỉnh sửa.");
    error.statusCode = 400;
    throw error;
  }

  // Nếu rejected (Fresh Rejected) -> Cho phép edit lại
  let freshRejected;
  if (isObjectId) {
    freshRejected = await CourseRevision.findOne({
      _id: slug,
      instructor: instructorId,
      course: null,
      status: 'rejected'
    }).lean();
  } else {
    freshRejected = await CourseRevision.findOne({
      'data.slug': slug,
      instructor: instructorId,
      course: null,
      status: 'rejected'
    }).lean();
  }

  if (freshRejected) {
    return signCourseResources({
      ...freshRejected.data,
      thumbnail: signThumbnailUrl(freshRejected.data?.thumbnail),
      _id: freshRejected._id,
      revisionId: freshRejected._id,
      status: 'rejected',
      reviewMessage: freshRejected.reviewMessage || null,
      reviewHistory: freshRejected.reviewHistory || [],
      isUpdateMode: false
    });
  }

  // Nếu changes_requested (Fresh Changes Requested) -> Cho phép edit lại và resubmit
  let freshChangesRequested;
  if (isObjectId) {
    freshChangesRequested = await CourseRevision.findOne({
      _id: slug,
      instructor: instructorId,
      course: null,
      status: 'changes_requested'
    }).lean();
  } else {
    freshChangesRequested = await CourseRevision.findOne({
      'data.slug': slug,
      instructor: instructorId,
      course: null,
      status: 'changes_requested'
    }).lean();
  }

  if (freshChangesRequested) {
    return signCourseResources({
      ...freshChangesRequested.data,
      thumbnail: signThumbnailUrl(freshChangesRequested.data?.thumbnail),
      _id: freshChangesRequested._id,
      revisionId: freshChangesRequested._id,
      status: 'changes_requested',
      reviewMessage: freshChangesRequested.reviewMessage || null,
      reviewHistory: freshChangesRequested.reviewHistory || [],
      isUpdateMode: false
    });
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
  // Ưu tiên: thumbnailUrl từ body (S3 CDN URL) -> file upload qua server (Cloudinary fallback) -> URL cũ
  let thumbnailUrl = courseData.thumbnailUrl || courseData.thumbnail || '';
  if (thumbnailFile && !thumbnailUrl) {
    // Fallback: nếu thumbnail gửi qua FormData file (legacy)
    const uploadResult = await uploadToCloudinary(thumbnailFile.buffer, 'dreamcourse/thumbnails');
    thumbnailUrl = uploadResult.secure_url;
  }
  
  if (thumbnailUrl) {
    thumbnailUrl = thumbnailUrl.split('?')[0];
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
    lectures: (sec.lectures || []).map(lec => ({
      title: lec.title,
      videoUrl: lec.videoUrl || '',
      duration: Number(lec.duration) || 0,
      order: lec.order || 0,
      isPreviewFree: lec.isPreviewFree || false,
      resources: (lec.resources || []).map(res => {
        let cleanUrl = res.url || '';
        if (cleanUrl) {
          cleanUrl = cleanUrl.split('?')[0];
        }
        return {
          title: res.title,
          url: cleanUrl,
          type: res.type || 'link'
        };
      }),
      // ✅ FIX: Lưu quizzes vào revision — trước đây bị bỏ sót hoàn toàn
      quizzes: (lec.quizzes || []).map(q => ({
        question: q.question || '',
        options: (q.options || []).map(o => ({ id: o.id, text: o.text || '' })),
        correctAnswer: q.correctAnswer || 'A',
        hint: q.hint || '',
        timestamp: Number(q.timestamp) || 0,
        isActive: q.isActive !== false,
      }))
    }))
  }));


  // 5. Xử lý Slug theo logic mới
  let finalSlug;

  if (courseData.courseId) {
    // CASE 2 & 3: Edit course đã publish -> Giữ nguyên slug của course gốc
    const liveCourse = await Course.findById(courseData.courseId).select('slug');
    if (liveCourse) {
      finalSlug = liveCourse.slug; // Slug không đổi khi update
    } else {
      finalSlug = courseData.slug || slugify(courseData.title, { lower: true, strict: true });
    }
  } else {
    // CASE 1: Fresh draft (chưa từng publish)

    if (courseData.revisionId) {
      // ✨ Đang edit draft có sẵn -> Kiểm tra xem có cần update slug không
      const existingRevision = await CourseRevision.findById(courseData.revisionId)
        .select('data.slug data.title');

      if (existingRevision && existingRevision.data.title === courseData.title) {
        // Title không đổi -> Giữ nguyên slug cũ
        finalSlug = existingRevision.data.slug;
      } else if (courseData.slug && courseData.slug.trim()) {
        // ✨ Frontend đã generate slug (có timestamp) -> dùng luôn, consistent với S3 key
        finalSlug = courseData.slug.trim();
      } else {
        // Fallback: Tạo slug mới
        const baseSlug = slugify(courseData.title, { lower: true, strict: true });
        finalSlug = `${baseSlug}-${Date.now()}`;
      }
    } else {
      // ✨ Tạo draft mới lần đầu
      if (courseData.slug && courseData.slug.trim()) {
        // Frontend đã tạo slug trước khi gọi API (khi upload S3) -> Dùng slug đó
        // Điều này đảm bảo S3 key và DB slug nhất quán với nhau
        finalSlug = courseData.slug.trim();
      } else {
        // Fallback nếu frontend chưa tạo slug
        const baseSlug = slugify(courseData.title, { lower: true, strict: true });
        finalSlug = `${baseSlug}-${Date.now()}`;
      }
    }
  }


  let previewUrl = courseData.previewUrl || '';
  if (previewUrl) {
    previewUrl = previewUrl.split('?')[0];
  }

  // 6. Chuẩn bị Data Object cho Revision
  const revisionData = {
    title: courseData.title,
    slug: finalSlug, // Slug được xử lý theo logic trên
    thumbnail: thumbnailUrl,
    previewUrl: previewUrl,
    shortDescription: courseData.shortDescription,
    description: courseData.description,
    price: Number(courseData.price) || 0,
    priceDiscount: Number(courseData.priceDiscount) || 0,
    durationInWeeks: Number(courseData.durationInWeeks) || 12,
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
  // Check xem có draft/rejected/changes_requested nào đang tồn tại không để update đè lên, tránh spam record
  const filter = {
    instructor: instructorId,
    // ✅ Fix Bug 2: thêm 'changes_requested' vào filter
    // Khi instructor submit lại sau yêu cầu sửa, phải tìm được record cũ để update thành 'pending'
    status: { $in: ['draft', 'rejected', 'changes_requested'] }
  };

  // Nếu có courseId (Case 2: Update Course Live)
  if (courseData.courseId) {
    filter.course = courseData.courseId;
  } else if (courseData.revisionId) {
    // ✨ Case 1: Fresh Draft đang edit tiếp -> Tìm theo _id của revision
    filter._id = courseData.revisionId;
    filter.course = null;
  } else {
    // ✨ Case 1: Fresh Draft lần đầu tạo -> Tìm theo instructor + course null + slug khớp
    // (nếu slug đã được frontend generate, dùng để tránh tạo mới)
    filter.course = null;
    if (courseData.slug) {
      filter['data.slug'] = courseData.slug;
    }
  }

  // ReviewMessage logic:
  // - Khi submit (pending): Set message reviewer muốn nói với admin
  // - Khi save draft: Xóa reviewMessage (không nên giữ message cũ)
  // - Khi là changes_requested -> pending (resubmit): Xóa reviewMessage cũ của admin
  const newReviewMessage = courseData.status === 'pending'
    ? (courseData.messageToReviewer || '')
    : ''; // Xóa message khi save draft

  // Thực hiện Upsert (Tìm thấy thì update, không thì tạo mới)
  const updatedRevision = await CourseRevision.findOneAndUpdate(
    filter,
    {
      instructor: instructorId,
      course: courseData.courseId || null,
      status: courseData.status || 'draft',
      version: nextVersion,
      data: revisionData,
      reviewMessage: newReviewMessage,
      // ✅ Xóa submittedAt cũ khi save draft, cập nhật khi submit
      ...(courseData.status === 'pending' ? { submittedAt: new Date() } : {})
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // GỬI THÔNG BÁO CHO ADMIN KHI SUBMIT PENDING
  if (courseData.status === 'pending' && updatedRevision) {
    const admins = await User.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await notificationService.createNotification({
        recipient: admin._id,
        sender: instructorId,
        type: "system",
        title: "Khóa học mới cần duyệt",
        message: `Giảng viên vừa gửi khóa học "${revisionData.title}" chờ duyệt.`,
        relatedId: updatedRevision._id,
        courseSlug: revisionData.slug || undefined
      });
    }
  }

  return updatedRevision;
};

/**
 * Xóa khóa học — xử lý đủ 4 trường hợp:
 *
 * Case A  : Fresh draft revision (course: null) — xóa vĩnh viễn revision
 * Case A2 : Rejected/changes_requested chưa link course — xóa vĩnh viễn
 * Case B  : Course đã publish, 0 học viên — Hidden
 * Case C  : Course đã publish, đã có học viên — Archived
 * Case D  : Revision gắn course đã publish đang rejected/draft — xóa revision
 */
export const deleteCourse = async (id, instructorId) => {
  // BƯỚC 1: Tìm Revision trước (ưu tiên để xử lý mọi loại revision)
  const revision = await CourseRevision.findOne({
    _id: id,
    instructor: instructorId,
  });

  if (revision) {
    // Không cho xóa khi revision đang pending (admin đang duyệt)
    if (revision.status === 'pending') {
      const err = new Error('Không thể xóa khi khóa học đang chờ Admin duyệt.');
      err.statusCode = 400;
      throw err;
    }

    // Case A / A2: Fresh revision chưa từng publish (course: null) — xóa vĩnh viễn
    if (!revision.course) {
      await CourseRevision.findByIdAndDelete(id);
      return {
        message: 'Đã xóa vĩnh viễn bản nháp khóa học.',
        action: 'deleted',
      };
    }

    // Case D: Revision gắn với course đã publish (rejected/changes_requested/draft)
    // Chỉ xóa revision, giữ nguyên course gốc đang publish
    if (['draft', 'rejected', 'changes_requested', 'archived'].includes(revision.status)) {
      await CourseRevision.findByIdAndDelete(id);
      return {
        message: 'Đã xóa bản chỉnh sửa. Khóa học gốc vẫn được giữ nguyên.',
        action: 'revision_deleted',
      };
    }
  }

  // BƯỚC 2: Tìm trong Course collection (course đã publish)
  const course = await Course.findOne({ _id: id, instructor: instructorId });

  if (course) {
    // Case C: Đã có học viên → Archive
    if ((course.studentsCount || 0) > 0) {
      if (course.status === 'archived') {
        return { message: 'Khóa học đã được lưu trữ.', action: 'archived' };
      }
      course.status = 'archived';
      await course.save();
      return {
        message: 'Khóa học đã chuyển sang Lưu trữ (Archived) vì đã có học viên.',
        action: 'archived',
      };
    }

    // Case B: Chưa có học viên → Hidden
    course.status = 'hidden';
    await course.save();
    return {
      message: 'Khóa học đã được ẩn (Hidden) khỏi marketplace.',
      action: 'hidden',
    };
  }

  const error = new Error('Không tìm thấy khóa học hoặc bạn không có quyền xóa.');
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

/**
 * Gửi nhắc nhở học bù đến tất cả học sinh bị trễ tiến độ (behind)
 */
export const sendCourseStudyReminder = async (courseId, instructorId) => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId });
  if (!course) {
    const err = new Error("Không tìm thấy khóa học hoặc bạn không có quyền gửi thông báo nhắc nhở của khóa học này.");
    err.statusCode = 403;
    throw err;
  }

  // 1. Quét toàn bộ học viên có trạng thái behind của khóa học đó trong Progresses
  const progressDocs = await Progress.find({
    course: courseId,
    scheduleStatus: 'behind'
  }).select('student').lean();

  const studentIds = progressDocs.map(p => p.student);
  if (studentIds.length === 0) {
    return {
      message: "Không có học viên nào bị trễ tiến độ để nhắc nhở.",
      remindedCount: 0
    };
  }

  // 2. Tạo thông báo nhắc nhở (Lưu DB + Bắn Realtime Socket + Email backup)
  let successCount = 0;
  for (const studentId of studentIds) {
    try {
      await notificationService.createNotification({
        recipient: studentId,
        sender: instructorId,
        type: "study_reminder",
        title: `Nhắc nhở học tập: Khóa học "${course.title}"`,
        message: `Bạn đang bị chậm lộ trình trong khóa học "${course.title}". Hãy dành thời gian học bù để kịp tiến độ nhé!`,
        metadata: {
          courseId: course._id,
          courseSlug: course.slug,
          targetScreen: 'Learning'
        }
      });
      successCount++;
    } catch (e) {
      console.error(`Lỗi gửi nhắc nhở cho học viên ${studentId}:`, e);
    }
  }

  return {
    message: `Đã gửi thành công thông báo nhắc nhở học tập đến ${successCount} học viên trễ tiến độ.`,
    remindedCount: successCount
  };
};
