import mongoose from 'mongoose';
import Course from '../modules/course/course.model.js';
import CourseRevision from '../modules/course/courseRevision.model.js';
import Section from '../modules/course/section.model.js';
import Lecture from '../modules/course/lecture.model.js';
import Discussion from '../modules/discussion/discussion.model.js';
import Enrollment from '../modules/enrollment/enrollment.model.js';
import Progress from '../modules/progress/progress.model.js';
import Cart from '../modules/cart/cart.model.js';
import Wishlist from '../modules/wishlist/wishlist.model.js';
import Notification from '../modules/notification/notification.model.js';
import Report from '../modules/report/report.model.js';

export async function deleteCourseAndRelations(courseId) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Xóa bằng object id
        // const course = await Course.findById(courseId).session(session);

        // Xóa bằng slug
        const course = await Course.findOne({ slug: courseId }).session(session);

        if (!course) {
            throw new Error('Course không tồn tại');
        }

        // 1) Lấy sectionIds từ course
        const sectionIds = course.sections || [];

        // 2) Lấy lectureIds từ các section
        const sections = await Section.find({ _id: { $in: sectionIds } })
            .select('_id lectures')
            .session(session);

        const lectureIds = sections.flatMap(section => section.lectures || []);

        // 3) Xóa các document phụ thuộc trực tiếp vào course
        await Promise.all([
            Discussion.deleteMany({ course: course._id }, { session }),
            Enrollment.deleteMany({ course: course._id }, { session }),
            Progress.deleteMany({ course: course._id }, { session }),
            Report.deleteMany({ course: course._id }, { session }),
            CourseRevision.deleteMany({ course: course._id }, { session }),
        ]);

        // 4) Gỡ course khỏi wishlist
        await Wishlist.updateMany(
            { courses: course._id },
            { $pull: { courses: course._id } },
            { session }
        );

        // 5) Gỡ course khỏi cart.items
        const carts = await Cart.find({ 'items.course': course._id }).session(session);

        for (const cart of carts) {
            cart.items = cart.items.filter(
                item => item.course.toString() !== course._id.toString()
            );
            cart.calculateTotals();
            await cart.save({ session });
        }

        // 6) Optional: dọn notification nếu app đang dùng relatedId/courseSlug để gắn course
        await Notification.deleteMany(
            {
                $or: [
                    { relatedId: course._id },
                    { courseSlug: course.slug }
                ]
            },
            { session }
        );

        // 7) Xóa lectures trước rồi sections
        if (lectureIds.length) {
            await Lecture.deleteMany({ _id: { $in: lectureIds } }, { session });
        }

        if (sectionIds.length) {
            await Section.deleteMany({ _id: { $in: sectionIds } }, { session });
        }

        // 8) Xóa course
        await Course.deleteOne({ _id: course._id }, { session });

        await session.commitTransaction();

        return {
            success: true,
            deletedCourseId: course._id,
            deletedSections: sectionIds.length,
            deletedLectures: lectureIds.length,
        };
    } catch (error) {
        await session.abortTransaction();
        console.error(" ĐÃ XẢY RA LỖI KHI XÓA COURSE:", error);
        throw error;
    } finally {
        session.endSession();
    }
}

export async function deleteCourseController(req, res) {
    try {
        const { id } = req.params;

        const result = await deleteCourseAndRelations(id);

        return res.status(200).json({
            message: 'Xóa course và dữ liệu liên quan thành công',
            ...result,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || 'Lỗi khi xóa course',
        });
    }
}