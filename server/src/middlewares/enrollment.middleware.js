import mongoose from "mongoose";
import Enrollment from '../modules/enrollment/enrollment.model.js';
import Course from '../modules/course/course.model.js';

export const checkEnrollment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { slug, courseId, discussionId, replyId } = req.params;

    let targetCourseId = courseId;

    if (slug) {
      const course = await Course.findOne({ slug }).select('_id');
      if (!course) {
        return res.status(404).json({ message: 'Khóa học không tồn tại' });
      }
      targetCourseId = course._id;
    }

    // 2. Nếu có discussionId → lấy course từ discussion (route reply)
    if (!targetCourseId && discussionId) {
      const Discussion = mongoose.model('Discussion') || 
        mongoose.model('Discussion', new mongoose.Schema({ course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' } }));
      const discussion = await Discussion.findById(discussionId).select('course');
      if (!discussion) return res.status(404).json({ message: 'Thảo luận không tồn tại' });
      targetCourseId = discussion.course;
    }

    // THÊM MỚI: XỬ LÝ replyId → tìm discussion chứa reply
    if (!targetCourseId && replyId) {
      const Discussion = mongoose.model('Discussion') || 
        mongoose.model('Discussion', new mongoose.Schema({ 
          course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
          replies: [{ _id: mongoose.Schema.Types.ObjectId }]
        }));
      
      const discussion = await Discussion.findOne(
        { "replies._id": replyId },
        { course: 1 }
      );

      if (!discussion) {
        return res.status(404).json({ message: 'Bình luận không tồn tại' });
      }
      targetCourseId = discussion.course;
    }

    if (!targetCourseId) {
      return res.status(400).json({ message: 'Không xác định được khóa học' });
    }

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: targetCourseId
    });

    // if (!enrollment && req.user.role !== 'admin') {
    //     const isInstructor = await Course.findOne({ _id: targetCourseId, instructor: userId });
    //     if (!isInstructor) {
    //         return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này.' });
    //     }
    // }
    // Cho phép admin hoặc instructor của khóa học hoặc học viên đã ghi danh
    const isInstructor = await Course.findOne({ _id: targetCourseId, instructor: userId });

    console.log("userId:", userId, "targetCourseId:", targetCourseId, "isInstructor:", !!isInstructor, "role:", req.user.role);

    if (!enrollment && req.user.role !== 'admin' && !isInstructor) {
        return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này.' });
    }

    req.courseId = targetCourseId;
    
    next();
  } catch (error) {
    console.error('Check Enrollment Error:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra ghi danh.' });
  }
};