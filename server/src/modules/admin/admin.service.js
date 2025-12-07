// src/modules/admin/admin.service.js
import User from '../auth/auth.model.js';
import Course from '../course/course.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Payment from '../payment/payment.model.js';
import Category from '../category/category.model.js';
import CourseRevision from '../course/courseRevision.model.js';

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
    .select('name email avatar phone createdAt isVerified isBlocked')
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
    .select('name email avatar phone createdAt isBlocked bio expertise')
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