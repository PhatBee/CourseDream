import express from 'express';
import { searchCourses, getLecture, getCourseDetailsBySlug, getCourses, getLearningContent, uploadCourseVideo, createCourse } from './course.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { checkEnrollment } from '../../middlewares/enrollment.middleware.js';
import { uploadVideo, upload } from '../../middlewares/upload.middleware.js';


const router = express.Router();

router.get('/', getCourses);
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

// Route tạo khóa học
router.post(
  '/',
  verifyToken,
  // checkRole('instructor', 'admin'),
  upload.single('thumbnail'), // 'thumbnail' là key trong FormData
  createCourse
);

// router.delete('/:id', 
//     verifyToken, 
//     checkRole('admin'), 
//     courseController.deleteCourse
// );

router.get("/search", searchCourses);
router.get("/:courseId/lectures/:lectureId", verifyToken, getLecture);

export default router;