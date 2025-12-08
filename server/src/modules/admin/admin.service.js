// src/modules/admin/admin.service.js
import User from '../auth/auth.model.js';
import Course from '../course/course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Payment from '../payment/payment.model.js';
import Category from '../category/category.model.js';
import CourseRevision from '../course/courseRevision.model.js';
import Lecture from '../course/lecture.model.js';
import Section from '../course/section.model.js';

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

    // thêm thông báo vào email

  } else if (decision === 'reject') {
    user.instructorApplication.status = 'rejected';
    user.instructorApplication.reviewedAt = new Date();
    user.instructorApplication.adminNotes = adminNotes;

    // thêm logic thông báo vào email
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
  return await Course.find({ status: 'published' })
    .sort({ studentsCount: -1 })
    .limit(limit)
    .select('title slug thumbnail studentsCount price rating instructor')
    .populate('instructor', 'name avatar')
    .lean();
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
      $group: {
        _id: groupId,
        totalRevenue: { $sum: "$amount" },
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
        value: found ? found.totalRevenue : 0,
        count: found ? found.count : 0
      });
    }
  } else if (type === 'month') {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const found = stats.find(item => item._id.day === i);
      formattedData.push({
        label: `${i}/${currentMonth}`,
        value: found ? found.totalRevenue : 0,
        count: found ? found.count : 0
      });
    }
  } else {
    formattedData = stats.map(item => ({
      label: `${item._id.day}/${item._id.month}`,
      value: item.totalRevenue,
      count: item.count
    }));
  }

  const totalRevenueAllTime = await Payment.aggregate([
    { $match: { status: 'success' } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  return {
    chartData: formattedData,
    totalRevenue: totalRevenueAllTime[0]?.total || 0,
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
 * Lấy danh sách Course Revisions đang chờ duyệt (Admin)
 */
export const getPendingRevisions = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Lấy tất cả revision có status = 'pending'
  const revisions = await CourseRevision.find({ status: 'pending' })
    .populate('instructor', 'name email avatar')
    .populate('course', 'title slug status') // Nếu có course link (Case 2)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await CourseRevision.countDocuments({ status: 'pending' });
  const totalPages = Math.ceil(total / limit);

  // Format lại data cho frontend dễ hiển thị
  const formattedRevisions = revisions.map(rev => ({
    _id: rev._id,
    title: rev.data.title || 'Untitled Course',
    thumbnail: rev.data.thumbnail,
    instructor: rev.instructor,
    courseId: rev.course?._id || null, // Null = khóa học mới, có ID = chỉnh sửa
    courseName: rev.course?.title || null,
    courseStatus: rev.course?.status || null,
    revisionStatus: rev.status,
    submittedAt: rev.updatedAt, // Thời gian submit
    type: rev.course ? 'update' : 'new' // Phân biệt Case 1 và Case 2
  }));

  return {
    revisions: formattedRevisions,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  };
};

/**
 * Lấy chi tiết CourseRevision đang chờ duyệt (Admin)
 */
export const getPendingRevisionDetail = async (revisionId) => {
  const revision = await CourseRevision.findOne({
    _id: revisionId,
    status: 'pending'
  })
    .populate('instructor', 'name email avatar')
    .populate('course', 'title slug status version') // Course gốc (nếu có)
    .populate('data.categories', 'name slug')
    .lean();

  if (!revision) {
    const error = new Error("Không tìm thấy khóa học đang chờ duyệt.");
    error.statusCode = 404;
    throw error;
  }

  // Nếu là Case 2 (Update course đã publish), lấy thông tin course gốc để so sánh
  let originalCourse = null;
  if (revision.course) {
    originalCourse = await Course.findById(revision.course)
      .populate({
        path: 'sections',
        populate: { path: 'lectures' }
      })
      .populate('categories', 'name slug')
      .lean();
  }

  return {
    revision: {
      ...revision,
      // Bung data ra ngoài để dễ access
      ...revision.data
    },
    originalCourse, // Để admin có thể so sánh (nếu là update)
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

  if (revision.status !== 'pending') {
    const error = new Error("Chỉ có thể duyệt các khóa học đang ở trạng thái Pending.");
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
          resources: lecData.resources || []
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
      slug: revision.data.slug,
      thumbnail: revision.data.thumbnail,
      previewUrl: revision.data.previewUrl,
      shortDescription: revision.data.shortDescription,
      description: revision.data.description,
      price: revision.data.price || 0,
      priceDiscount: revision.data.priceDiscount || 0,
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
          resources: lecData.resources || []
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
    liveCourse.slug = revision.data.slug;
    liveCourse.thumbnail = revision.data.thumbnail;
    liveCourse.previewUrl = revision.data.previewUrl;
    liveCourse.shortDescription = revision.data.shortDescription;
    liveCourse.description = revision.data.description;
    liveCourse.price = revision.data.price || 0;
    liveCourse.priceDiscount = revision.data.priceDiscount || 0;
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

  if (revision.status !== 'pending') {
    const error = new Error("Chỉ có thể từ chối các khóa học đang ở trạng thái Pending.");
    error.statusCode = 400;
    throw error;
  }

  // Cập nhật status thành rejected và lưu message
  revision.status = 'rejected';
  revision.reviewMessage = reviewMessage;
  await revision.save();

  return {
    message: "Khóa học đã bị từ chối. Instructor có thể chỉnh sửa và submit lại."
  };
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