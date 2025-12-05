import Enrollment from "./enrollment.model.js";
import Course from "../course/course.model.js";

class EnrollmentService {

    async enrollStudent(studentId, courseIds) {
        // Duyệt qua từng khóa học để tạo enrollment
        const enrollments = courseIds.map(courseId => ({
            student: studentId,
            course: courseId,
            enrolledAt: new Date(),
            progress: 0,
            isCompleted: false
        }));

        // Dùng insertMany để lưu hàng loạt, option ordered: false để nếu trùng 1 cái thì các cái khác vẫn chạy
        try {
            // Kiểm tra xem đã enroll chưa để tránh trùng lặp (tùy chọn, vì insertMany có thể lỗi duplicate key)
            for (const courseId of courseIds) {
                await Enrollment.findOneAndUpdate(
                    { student: studentId, course: courseId },
                    {
                        student: studentId,
                        course: courseId,
                        enrolledAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                // Tăng studentsCount trong Course
                await Course.findByIdAndUpdate(courseId, { $inc: { studentsCount: 1 } });
            }
        } catch (error) {
            console.error("Enrollment error:", error);
        }
    }
    // Lấy danh sách khoá học đã đăng ký của user
    async getMyEnrollments(userId) {
        return Enrollment.find({ student: userId })
            .populate({
                path: "course",
                select: "title slug thumbnail price instructor",
                populate: { path: "instructor", select: "name avatar" }
            })
            .sort({ enrolledAt: -1 });
    }
}

export default new EnrollmentService();

