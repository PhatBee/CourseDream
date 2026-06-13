import express from 'express';
import * as progressController from './progress.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);


/**
 * @route   POST /api/progress/video
 * @desc    Lưu tiến độ xem video (gọi định kỳ mỗi 10s)
 * @body    { courseSlug, lectureId, watchedSeconds }
 */
router.post('/video', progressController.saveVideoProgress);

/**
 * @route   GET /api/progress/video/:courseSlug/:lectureId
 * @desc    Lấy last_watched_time của một bài giảng
 */
router.get('/video/:courseSlug/:lectureId', progressController.getVideoProgress);

/**
 * @route   GET /api/progress/:courseSlug
 * @desc    Lấy thông tin tiến độ học tập theo SLUG
 */
router.get('/:courseSlug', progressController.getProgress);

/**
 * @route   POST /api/progress/toggle
 * @desc    Đánh dấu hoàn thành / bỏ hoàn thành bài giảng
 */
router.post('/toggle', progressController.toggleLectureCompletion);

/**
 * @route   POST /api/progress/quiz-answer
 * @desc    Học viên submit đáp án quiz (validate server-side)
 * @body    { courseSlug, lectureId, quizIndex, answer }
 */
router.post('/quiz-answer', progressController.submitQuizAnswer);

export default router;