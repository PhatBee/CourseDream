import express from 'express';
import {
  searchCourses, getLecture, getCourseDetailsBySlug, getCourses, getLearningContent, uploadCourseVideo, createCourse,
  getLevels, getCourseStats, createCourseRevision, getMyCourses, getCourseForEdit, uploadCourseResource
} from './course.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { checkEnrollment } from '../../middlewares/enrollment.middleware.js';
import { uploadVideo, upload, uploadDocument } from '../../middlewares/upload.middleware.js';


const router = express.Router();

router.get('/', getCourses);
router.get('/levels', getLevels);
router.get('/stats', getCourseStats);
router.get("/search", searchCourses);

router.get(
  '/instructor/my-courses',
  verifyToken,
  // checkRole('instructor'), // Uncomment nếu muốn chặn student
  getMyCourses
);

/**
 * @route   GET /api/v1/courses/:slug
 * @desc    Lấy chi tiết khóa học
 * @access  Public
 */
router.get('/:slug', getCourseDetailsBySlug);
router.get(
  '/:slug/learn',
  verifyToken,
  checkEnrollment,
  getLearningContent
);

// Route upload video (Cần auth và role instructor/admin)
router.post(
  '/upload-video',
  verifyToken,
  // checkRole('instructor', 'admin'),
  uploadVideo.single('video'), // 'video' là key trong FormData
  uploadCourseVideo
);

// Route upload tài liệu (Resource)
router.post(
  '/upload-resource',
  verifyToken,
  // checkRole('instructor', 'admin'),
  uploadDocument.single('file'), // Key là 'file'
  uploadCourseResource
);

// Route tạo khóa học (bản Revision)
router.post(
  '/',
  verifyToken,
  // checkRole('instructor', 'admin'),
  upload.single('thumbnail'), // 'thumbnail' là key trong FormData
  createCourseRevision
);

router.get(
  '/instructor/edit/:slug', // Route mới
  verifyToken,
  // checkRole('instructor'),
  getCourseForEdit
);

// router.delete('/:id', 
//     verifyToken, 
//     checkRole('admin'), 
//     courseController.deleteCourse
// );

router.get("/:courseId/lectures/:lectureId", verifyToken, getLecture);

export default router;