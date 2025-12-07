import mongoose from "mongoose";
import review from "../review/review.model.js";
import enrollment from "../enrollment/enrollment.model.js";
import course from "../course/course.model.js";

const InstructorProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    // UI Hiển thị trên trang Instructor
    headline: { type: String },              // Ví dụ: "Senior Backend Developer"

    // Từ hồ sơ apply
    experience: { type: String },
    education: { type: String },

    // Mạng xã hội
    socialLinks: {
        website: String,
        facebook: String,
        youtube: String,
        linkedin: String,
        twitter: String
    },

    // Thông tin thanh toán (Nhận tiền)
    payout: {
        bankName: String,
        bankAccount: String,
        paypalEmail: String,
        stripeId: String
    },

    // Thống kê
    totalStudents: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }, // trung bình ví dụ 4.5

    // Lĩnh vực giảng dạy
    specialties: [String],

}, { timestamps: true });

// Tính toán thống kê
InstructorProfileSchema.pre('save', async function (next) {
    const instructor = this;

    try {
        // 1. Tìm tất cả khóa học của giảng viên này
        // Cần đảm bảo instructor.user có giá trị. 
        if (!instructor.user) return next();

        // Sử dụng mongoose.model để tránh circular dependency nếu có
        const Course = mongoose.model('Course');
        const Enrollment = mongoose.model('Enrollment');
        const Review = mongoose.model('Review');

        const courses = await Course.find({ instructor: instructor.user }).select('_id');
        const courseIds = courses.map(c => c._id);

        if (courseIds.length === 0) {
            instructor.totalStudents = 0;
            instructor.totalReviews = 0;
            instructor.rating = 0;
            return next();
        }

        // 2. Tính totalStudents (Số lượng enrollment cho các khóa học của giảng viên)
        const totalEnrollments = await Enrollment.countDocuments({ course: { $in: courseIds } });
        instructor.totalStudents = totalEnrollments;

        // 3. Tính totalReviews và rating trung bình từ tất cả các khóa học
        const stats = await Review.aggregate([
            { $match: { course: { $in: courseIds } } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    avgRating: { $avg: '$rating' }
                }
            }
        ]);

        instructor.totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;
        instructor.rating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

        next();
    } catch (error) {
        // console.error("Error calculating instructor stats:", error);
        next(error);
    }
});

export default mongoose.model("InstructorProfile", InstructorProfileSchema);
