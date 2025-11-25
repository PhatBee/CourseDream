import Enrollment from "./enrollment.model.js";
import Course from "../course/course.model.js";

class EnrollmentService {

  // Enroll student vào nhiều khoá
  async enrollStudent(studentId, courseIds) {
    try {
      for (const courseId of courseIds) {
        // Upsert enrollment tránh trùng lặp
        const enrollment = await Enrollment.findOneAndUpdate(
          { student: studentId, course: courseId },
          {
            student: studentId,
            course: courseId,
            enrolledAt: new Date()
          },
          { upsert: true, new: true }
        );

        // Nếu là bản ghi mới => tăng studentsCount
        if (enrollment.isNew) {
          await Course.findByIdAndUpdate(courseId, {
            $inc: { studentsCount: 1 }
          });
        }
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      throw err;
    }
  }

  // Lấy danh sách khoá học đã đăng ký của user
  async getMyEnrollments(userId) {
    return Enrollment.find({ student: userId })
      .populate("course", "title slug thumbnail price")
      .sort({ enrolledAt: -1 });
  }
}

export default new EnrollmentService();

