import Course from "../course/course.model.js";
import Enrollment from "../enrollment/enrollment.model.js";
import InstructorProfile from "../user/InstructorProfile.model.js";

/**
 * Lấy thống kê cho instructor
 */
export const getStatsForInstructor = async (instructorId) => {
  // Lấy tất cả courseIds của instructor
  const courseIds = await Course.find({ instructor: instructorId }).distinct("_id");

  // Chạy song song các truy vấn
  const [
    totalCourses,
    fullCourses,
    recentCourses,
    totalStudentsList
  ] = await Promise.all([
    // Tổng số khóa học
    Course.countDocuments({ instructor: instructorId }),

    // Lấy tất cả khóa học (để FE có nút xem tất cả)
    Course.find({ instructor: instructorId })
      .sort({ createdAt: -1 })
      .select("title slug thumbnail studentsCount rating createdAt status"),

    // Lấy 5 khóa học mới nhất
    Course.find({ instructor: instructorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title slug thumbnail studentsCount rating createdAt status"),

    // Lấy danh sách học viên UNIQUE tham gia tất cả các khóa của instructor
    Enrollment.distinct("student", { course: { $in: courseIds } })
  ]);

  return {
    totalCourses,
    recentCourses,      // 5 khóa học mới nhất
    fullCourses,        // tất cả khóa học
    totalStudents: totalStudentsList.length,
    totalStudentsList,  // danh sách học viên unique (để FE xem chi tiết)
  };
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
