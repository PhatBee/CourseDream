import express from 'express';
import * as progressController from './progress.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

/**
 * @route   GET /api/progress/:courseSlug
 * @desc    Lấy thông tin tiến độ bằng SLUG
 */
router.get('/:courseSlug', progressController.getProgress);

/**
 * @route   POST /api/progress/toggle
 * @desc    Đánh dấu hoàn thành (nhận slug trong body)
 */
router.post('/toggle', progressController.toggleLectureCompletion);

export default router;