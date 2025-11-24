import express from 'express';
import { searchCourses, getLecture, getCourseDetailsBySlug, getCourses } from './course.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';
import { checkEnrollment } from '../../middlewares/enrollment.middleware.js';


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

// router.post('/', 
//     verifyToken, 
//     checkRole('admin', 'instructor'), 
//     courseController.createCourse
// );

// router.delete('/:id', 
//     verifyToken, 
//     checkRole('admin'), 
//     courseController.deleteCourse
// );

router.get("/search", searchCourses);
router.get("/:courseId/lectures/:lectureId", verifyToken, getLecture);

export default router;