import Enrollment from '../modules/enrollment/enrollment.model.js';
import Course from '../modules/course/course.model.js';

export const checkEnrollment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { slug, courseId } = req.params;

    let targetCourseId = courseId;

    if (slug) {
      const course = await Course.findOne({ slug }).select('_id');
      if (!course) {
        return res.status(404).json({ message: 'Khóa học không tồn tại' });
      }
      targetCourseId = course._id;
    }

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: targetCourseId
    });

    if (!enrollment && req.user.role !== 'admin') {
        const isInstructor = await Course.findOne({ _id: targetCourseId, instructor: userId });
        if (!isInstructor) {
            return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này.' });
        }
    }

    req.courseId = targetCourseId;
    
    next();
  } catch (error) {
    console.error('Check Enrollment Error:', error);
    res.status(500).json({ message: 'Lỗi server khi kiểm tra ghi danh.' });
  }
};