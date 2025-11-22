import express from 'express';
import * as courseController from './course.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', courseController.getCourses);
/**
 * @route   GET /api/v1/courses/:slug
 * @desc    Lấy chi tiết khóa học
 * @access  Public
 */
router.get('/:slug', courseController.getCourseDetailsBySlug);

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

export default router;