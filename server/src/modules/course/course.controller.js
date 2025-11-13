// Thay đổi 'require' thành 'import'
import * as courseService from './course.service.js';

/**
 * @desc    Lấy chi tiết khóa học
 * @route   GET /api/v1/courses/:slug
 */
export const getCourseDetailsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await courseService.getCourseDetailsBySlug(slug);

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};