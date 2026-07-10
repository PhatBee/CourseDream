import Enrollment from "./enrollment.model.js";
import Course from "../course/course.model.js";
import Progress from "../progress/progress.model.js"
import { signThumbnailUrl } from '../../config/aws.js';

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
        const enrollments = await Enrollment.find({ student: userId })
            .populate({
                path: "course",
                select: "title slug thumbnail price instructor totalLectures totalHours categories durationInWeeks", // Thêm categories và durationInWeeks
                populate: [
                    { path: "instructor", select: "name avatar" },
                    { path: "categories", select: "name slug" } // Populate categories
                ]
            })
            .sort({ lastViewedAt: -1, enrolledAt: -1 })
            .lean();

        enrollments.forEach(e => {
            if (e.course && e.course.thumbnail) {
                e.course.thumbnail = signThumbnailUrl(e.course.thumbnail);
            }
        });

        return enrollments;
    }

    async getStudentDashboard(userId) {
        // 1. Lấy danh sách ghi danh
        const enrollments = await Enrollment.find({ student: userId })
            .populate({
                path: "course",
                select: "title slug thumbnail totalLectures totalHours instructor durationInWeeks", // Lấy các trường cần cho Dashboard
                populate: { path: "instructor", select: "name" }
            })
            .sort({ lastViewedAt: -1, enrolledAt: -1 })
            .lean();

        // 2. Kẹp thêm thông tin Progress
        const data = await Promise.all(enrollments.map(async (enrollment) => {
            if (!enrollment.course) return null;

            const progress = await Progress.findOne({ 
                student: userId, 
                course: enrollment.course._id 
            });

            if (enrollment.course.thumbnail) {
                enrollment.course.thumbnail = signThumbnailUrl(enrollment.course.thumbnail);
            }

            return {
                _id: enrollment._id, // ID của enrollment
                enrolledAt: enrollment.enrolledAt,
                isActivated: enrollment.isActivated,
                startedAt: enrollment.startedAt,
                endedAt: enrollment.endedAt,
                course: enrollment.course,
                // Object progress được tính toán riêng
                learningProgress: {
                    percentage: progress ? progress.percentage : 0,
                    completedLessons: progress ? progress.completedLectures.length : 0,
                    totalLessons: enrollment.course.totalLectures || 0,
                    scheduleStatus: progress ? (progress.scheduleStatus || 'in-progress') : 'in-progress'
                }
            };
        }));

        return data.filter(item => item !== null);
    }

    async activateCourse(enrollmentId, userId) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, student: userId }).populate("course");
        if (!enrollment) {
            const error = new Error("Không tìm thấy thông tin ghi danh của bạn.");
            error.statusCode = 404;
            throw error;
        }

        if (enrollment.isActivated) {
            const error = new Error("Khóa học này đã được kích hoạt trước đó.");
            error.statusCode = 400;
            throw error;
        }

        const course = enrollment.course;
        if (!course) {
            const error = new Error("Không tìm thấy thông tin khóa học.");
            error.statusCode = 404;
            throw error;
        }

        const durationInWeeks = course.durationInWeeks || 12;
        const startedAt = new Date();
        const durationInMs = durationInWeeks * 7 * 24 * 60 * 60 * 1000;
        const endedAt = new Date(startedAt.getTime() + durationInMs);

        enrollment.isActivated = true;
        enrollment.startedAt = startedAt;
        enrollment.endedAt = endedAt;

        await enrollment.save();

        // Populate lại giống getMyEnrollments
        const populatedEnrollment = await Enrollment.findById(enrollment._id)
            .populate({
                path: "course",
                select: "title slug thumbnail price instructor totalLectures totalHours categories durationInWeeks",
                populate: [
                    { path: "instructor", select: "name avatar" },
                    { path: "categories", select: "name slug" }
                ]
            })
            .lean();

        if (populatedEnrollment.course && populatedEnrollment.course.thumbnail) {
            populatedEnrollment.course.thumbnail = signThumbnailUrl(populatedEnrollment.course.thumbnail);
        }

        return populatedEnrollment;
    }
}

export default new EnrollmentService();

