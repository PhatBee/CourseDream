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

export const getCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getAllCourses(req.query);
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy nội dung bài học (Private)
 * @route   GET /api/v1/courses/:slug/learn
 */
export const getLearningContent = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;

    const data = await courseService.getLearningDetails(slug, userId);

    res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};