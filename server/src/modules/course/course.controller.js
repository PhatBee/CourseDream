// src/modules/course/course.controller.js
import Course from './course.model.js';
import * as courseService from './course.service.js';
import { getCDNUrl, generateSignedVideoUrl, extractKeyFromCDNUrl } from '../../config/aws.js';
import Lecture from './lecture.model.js';

/**
 * @desc    Lấy chi tiết khóa học
 * @route   GET /api/v1/courses/:slug
 */
export const getCourseDetailsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const data = await courseService.getCourseDetailsBySlug(slug, req.user);

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

// AWS S3 video, thumbnail, preview, and resource upload functions have been moved to instructor.controller.js

// ======================== COURSE MANAGEMENT ========================

// createCourseRevision has been moved to instructor.controller.js

export const getLevels = async (req, res, next) => {
  try {
    const levels = (await Course.distinct('level')).filter(lv => lv);
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

// getMyCourses has been moved to instructor.controller.js

export const getPopularCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getPopularCourses();

    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

// getCourseForEdit, deleteCourse, and activateCourse have been moved to instructor.controller.js

// ======================== VIDEO PLAYBACK (Signed URL) ========================

/**
 * @desc    Lấy link phát video ngắn hạn từ CloudFront (theo plan_2.md)
 *          DB lưu object_key/CDN URL -> Backend ký URL -> Frontend phát bằng Video.js
 * @route   GET /api/v1/courses/:courseId/lectures/:lectureId/play
 * @access  Private (Enrolled Student | Instructor | Admin) hoặc Preview Free
 */
export const getVideoPlayUrl = async (req, res, next) => {
  try {
    const { courseId, lectureId } = req.params;
    const user = req.user;

    // Lấy lecture từ DB
    const lecture = await Lecture.findById(lectureId).select('title videoUrl duration isPreviewFree resources section');

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Bài giảng không tồn tại' });
    }

    if (!lecture.isPreviewFree && !user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem bài giảng' });
    }

    if (!lecture.videoUrl) {
      return res.status(404).json({ success: false, message: 'Bài giảng chưa có video' });
    }

    // Trích xuất object_key từ CDN URL được lưu trong DB
    // DB lưu dạng: https://d2xxx.cloudfront.net/courses/abc/video.mp4
    // Cần lấy: courses/abc/video.mp4
    const objectKey = extractKeyFromCDNUrl(lecture.videoUrl);

    // Tạo Signed URL ngắn hạn (1 giờ) - KHÔNG lưu URL này vào DB
    const signedVideoUrl = generateSignedVideoUrl(objectKey, 3600);

    res.status(200).json({
      success: true,
      data: {
        lectureId: lecture._id,
        title: lecture.title,
        videoUrl: signedVideoUrl,   // URL có thời hạn, dùng để phát ngay
        expiresIn: 3600,             // Giây
        duration: lecture.duration,
        isPreviewFree: lecture.isPreviewFree,
        resources: lecture.resources || [],
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lấy preview video URL cho trang CourseDetail (intro video)
 * @route   GET /api/v1/courses/:slug/preview-url
 * @access  Public
 */
export const getCoursePreviewUrl = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).select('title previewUrl thumbnail').lean();

    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' });
    }

    let previewVideoUrl = null;

    if (course.previewUrl) {
      const objectKey = extractKeyFromCDNUrl(course.previewUrl);
      // Preview video có thể là public (không cần signed URL) hoặc signed
      previewVideoUrl = generateSignedVideoUrl(objectKey, 1800); // 30 phút
    }

    res.status(200).json({
      success: true,
      data: {
        previewUrl: previewVideoUrl,
        thumbnail: course.thumbnail,
      }
    });
  } catch (error) {
    next(error);
  }
};