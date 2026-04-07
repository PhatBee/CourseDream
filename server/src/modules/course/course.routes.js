// src/modules/course/course.routes.js
import express from 'express';
import {
  searchCourses, getLecture, getCourseDetailsBySlug, getCourses, getLearningContent,
  getLevels, getCourseStats, createCourseRevision, getMyCourses, getCourseForEdit,
  deleteCourse, activateCourse, getPopularCourses,
  // AWS S3 Presign Controllers
  presignVideoUpload, presignThumbnailUpload, presignPreviewUpload, presignResourceUpload,
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

// ==================== AWS S3 PRESIGN ROUTES (Instructor/Admin) ====================

// Upload video lên S3 (presigned URL)
router.post('/videos/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignVideoUpload);

// Upload thumbnail lên S3
router.post('/thumbnails/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignThumbnailUpload);

// Upload preview video lên S3
router.post('/previews/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignPreviewUpload);

// Upload resource (PDF, Doc...) lên S3
router.post('/resources/presign-upload', verifyToken, checkRole('instructor', 'admin'), presignResourceUpload);

// ==================== INSTRUCTOR ROUTES ====================

router.get('/instructor/my-courses', verifyToken, getMyCourses);
router.get('/instructor/edit/:slug', verifyToken, getCourseForEdit);

// Tạo khóa học mới (Course Revision)
router.post('/', verifyToken, upload.single('thumbnail'), createCourseRevision);

// Xóa / Kích hoạt khóa học
router.delete('/:id', verifyToken, deleteCourse);
router.patch('/:id/activate', verifyToken, activateCourse);

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

router.get('/:slug', getCourseDetailsBySlug);

router.get('/:slug/learn', verifyToken, checkEnrollment, getLearningContent);

router.get('/:courseId/lectures/:lectureId', verifyToken, getLecture);

export default router;