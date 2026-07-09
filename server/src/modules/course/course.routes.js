// src/modules/course/course.routes.js
import express from 'express';
import {
  searchCourses, getLecture, getCourseDetailsBySlug, getCourses, getLearningContent,
  getLevels, getCourseStats, getPopularCourses,
  // Video Playback (CloudFront Signed URL)
  getVideoPlayUrl, getCoursePreviewUrl,
} from './course.controller.js';
import { verifyToken, optionalAuth } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { checkEnrollment } from '../../middlewares/enrollment.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
// import { deleteCourseController } from '../../utils/utils.js';

const router = express.Router();

// Xóa khóa học (cảnh báo : chỉ dành cho dev)
// router.delete('/:id', deleteCourseController);

// ==================== PUBLIC ROUTES ====================
router.get('/', getCourses);
router.get('/levels', getLevels);
router.get('/stats', getCourseStats);
router.get('/search', searchCourses);
router.get('/popular', getPopularCourses);


// ==================== VIDEO PLAYBACK (CloudFront Signed URL) ====================

/**
 * GET /api/v1/courses/:slug/preview-url
 * Lấy preview video URL cho trang CourseDetail (public)
 */
router.get('/:slug/preview-url', getCoursePreviewUrl);

/**
 * GET /api/v1/courses/:courseId/lectures/:lectureId/play
 * Tạo CloudFront Signed URL ngắn hạn để phát video bài giảng
 * - isPreviewFree = true: public (không cần đăng nhập)
 * - isPreviewFree = false: cần token (enrolled student)
 */
router.get('/:courseId/lectures/:lectureId/play', optionalAuth, getVideoPlayUrl);

// ==================== DETAIL / LEARNING ROUTES ====================

router.get('/:slug', optionalAuth, getCourseDetailsBySlug);

router.get('/:slug/learn', verifyToken, checkEnrollment, getLearningContent);

router.get('/:courseId/lectures/:lectureId', verifyToken, getLecture);

export default router;