import Course from "../course/course.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import InstructorProfile from "../user/InstructorProfile.model.js";
import Progress from "../progress/progress.model.js";

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

export const getInstructorDashboardStats = async (instructorId) => {
  const instructorCourses = await Course.find({ instructor: instructorId }).select('_id studentsCount');
  const courseIds = instructorCourses.map(c => c._id);

  const totalCourses = instructorCourses.length;

  const totalStudents = instructorCourses.reduce((acc, course) => acc + (course.studentsCount || 0), 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayEnrollments = await Enrollment.countDocuments({
    course: { $in: courseIds },
    enrolledAt: { $gte: startOfToday }
  });

  const recentCourses = await Course.find({ instructor: instructorId })
    .sort({ updatedAt: -1 })
    .limit(3)
    .select('title slug thumbnail status studentsCount price createdAt')
    .lean();

  return {
    stats: {
      totalCourses,
      totalStudents,
      todayEnrollments
    },
    recentCourses
  };
};

/**
 * Lấy danh sách học viên đã enrolled của một khóa học
 */
export const getCourseStudents = async (courseId, instructorId, { page = 1, limit = 10 } = {}) => {
  const course = await Course.findOne({ _id: courseId, instructor: instructorId });
  if (!course) {
    const err = new Error("Không tìm thấy khóa học hoặc bạn không có quyền xem thông tin khóa học này.");
    err.status = 403;
    throw err;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skipNum = (pageNum - 1) * limitNum;

  const totalItems = await Enrollment.countDocuments({ course: courseId });
  const enrollments = await Enrollment.find({ course: courseId })
    .populate("student", "name avatar email")
    .sort({ enrolledAt: -1 })
    .skip(skipNum)
    .limit(limitNum)
    .lean();

  const studentIds = enrollments.map(e => e.student?._id).filter(id => !!id);

  const progresses = await Progress.find({
    course: courseId,
    student: { $in: studentIds }
  }).lean();

  const studentsData = enrollments.map(e => {
    const studentProgress = e.student 
      ? progresses.find(p => p.student.toString() === e.student._id.toString())
      : null;
    return {
      student: e.student,
      enrolledAt: e.enrolledAt,
      progress: studentProgress ? {
        percentage: studentProgress.percentage || 0,
        updatedAt: studentProgress.updatedAt || e.lastViewedAt || e.enrolledAt
      } : {
        percentage: 0,
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