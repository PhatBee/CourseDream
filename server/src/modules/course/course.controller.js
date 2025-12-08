// Thay đổi 'require' thành 'import'
import Course from './course.model.js';
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
 * @desc    Upload tài liệu khóa học (PDF, Doc, Zip...)
 * @route   POST /api/courses/upload-resource
 */
export const uploadCourseResource = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }
    const { title } = req.body;
    // Gọi service upload resource
    const result = await courseService.uploadResource(req.file, title || "Course Resource");

    res.status(200).json({
      success: true,
      data: result // { url, originalName, format }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo HOẶC Cập nhật Course Revision (Draft/Pending)
 * @route   POST /api/courses
 */
export const createCourseRevision = async (req, res, next) => {
  try {
    const courseData = req.body;
    const thumbnailFile = req.file;
    const instructorId = req.user._id;

    // Gọi service để xử lý Revision
    const revision = await courseService.createOrUpdateRevision(courseData, thumbnailFile, instructorId);

    res.status(201).json({
      success: true,
      message: courseData.status === 'pending' ? "Course submitted for review" : "Draft saved successfully",
      data: revision
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Tạo khóa học mới
 * @route   POST /api/courses
 * SẼ SỬA LẠI SAU, HIỆN SẼ CHƯA DÙNG (CỦA ADMIN)
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

export const getLevels = async (req, res, next) => {
  try {
    const levels = (await Course.distinct('level')).filter(lv => lv);
    console.log("Levels:", levels);
    res.json(levels);
  } catch (err) {
    next(err);
  }
};

export const getCourseStats = async (req, res, next) => {
  try {
    const stats = await courseService.getCourseStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
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

/**
 * @desc    Lấy thông tin khóa học để Edit (Instructor Only)
 * @route   GET /api/courses/instructor/edit/:slug
 */
export const getCourseForEdit = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const instructorId = req.user._id;

    // Gọi service
    const data = await courseService.getCourseForEdit(slug, instructorId);

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Xóa khóa học (Instructor) - Logic phức tạp (Delete/Hide/Archive)
 * @route   DELETE /api/courses/:id
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const instructorId = req.user._id;

    const result = await courseService.deleteCourse(id, instructorId);

    res.status(200).json({
      success: true,
      message: result.message,
      action: result.action // 'deleted', 'hidden', 'archived'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Kích hoạt lại khóa học (Hidden -> Published)
 * @route   PATCH /api/courses/:id/activate
 */
export const activateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await courseService.activateCourse(id, req.user._id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
}

// ==================== ADMIN CONTROLLERS ====================