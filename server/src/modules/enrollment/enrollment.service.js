import Enrollment from "./enrollment.model.js";
import Course from "../course/course.model.js";
import Progress from "../progress/progress.model.js"

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
                select: "title slug thumbnail price instructor totalLectures totalHours instructor",
                populate: { path: "instructor", select: "name avatar" }
            })
            .sort({ enrolledAt: -1 });
    }

    async getStudentDashboard(userId) {
        // 1. Lấy danh sách ghi danh
        const enrollments = await Enrollment.find({ student: userId })
            .populate({
                path: "course",
                select: "title slug thumbnail totalLectures totalHours instructor", // Lấy các trường cần cho Dashboard
                populate: { path: "instructor", select: "name" }
            })
            .sort({ enrolledAt: -1 })
            .lean();

        // 2. Kẹp thêm thông tin Progress
        const data = await Promise.all(enrollments.map(async (enrollment) => {
            if (!enrollment.course) return null;

            const progress = await Progress.findOne({ 
                student: userId, 
                course: enrollment.course._id 
            });

            return {
                _id: enrollment._id, // ID của enrollment
                enrolledAt: enrollment.enrolledAt,
                course: enrollment.course,
                // Object progress được tính toán riêng
                learningProgress: {
                    percentage: progress ? progress.percentage : 0,
                    completedLessons: progress ? progress.completedLectures.length : 0,
                    totalLessons: enrollment.course.totalLectures || 0
                }
            };
        }));

        return data.filter(item => item !== null);
    }
}

export default new EnrollmentService();

