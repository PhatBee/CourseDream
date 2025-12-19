import Course from "../course/course.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import InstructorProfile from "../user/InstructorProfile.model.js";

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