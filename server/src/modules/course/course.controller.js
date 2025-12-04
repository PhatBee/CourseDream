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
    const result = await courseService.getAllCourses(req.query);

    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination
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

export const searchCourses = async (req, res, next) => {
  try {
    const result = await courseService.searchCourses(req.query);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getLecture = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const user = req.user;
    const result = await courseService.getLecture({ courseId, lectureId, user });

    if (result.error) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.json({ lecture: result.lecture });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload video lên YouTube
 * @route   POST /api/v1/courses/upload-video
 */
export const uploadCourseVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file provided" });
    }
    const { title } = req.body;
    const result = await courseService.uploadVideo(req.file, title || "Course Video");

    res.status(200).json({
      success: true,
      data: result // { videoId, videoUrl }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo khóa học mới
 * @route   POST /api/v1/courses
 */
export const createCourse = async (req, res, next) => {
  try {
    // req.body chứa các field text, req.file chứa thumbnail
    const courseData = req.body;
    const thumbnailFile = req.file;
    const instructorId = req.user._id;

    const newCourse = await courseService.createCourse(courseData, thumbnailFile, instructorId);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy khóa học của Instructor hiện tại
 * @route   GET /api/courses/instructor/my-courses
 */
export const getMyCourses = async (req, res, next) => {
  try {
    const instructorId = req.user._id;
    const result = await courseService.getInstructorCourses(instructorId, req.query);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};