import express from 'express';
import * as courseController from './course.controller.js';

const router = express.Router();

/**
 * @route   GET /api/v1/courses/:slug
 * @desc    Lấy chi tiết khóa học
 * @access  Public
 */
router.get('/:slug', courseController.getCourseDetailsBySlug);

export default router;