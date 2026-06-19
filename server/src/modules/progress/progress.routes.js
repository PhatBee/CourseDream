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

/**
 * @route   DELETE /api/progress/quiz-reset
 * @desc    Reset 1 quiz cụ thể để làm lại
 * @body    { courseSlug, lectureId, quizIndex }
 */
router.delete('/quiz-reset', progressController.resetQuiz);

/**
 * @route   DELETE /api/progress/quiz-reset-all
 * @desc    Reset tất cả quiz của 1 bài giảng
 * @body    { courseSlug, lectureId }
 */
router.delete('/quiz-reset-all', progressController.resetAllQuizzes);

/**
 * @route   GET /api/progress/quiz-history/:courseSlug/:lectureId
 * @desc    Lấy lịch sử quiz đã làm của 1 bài giảng
 */
router.get('/quiz-history/:courseSlug/:lectureId', progressController.getQuizHistory);

/**
 * @route   GET /api/progress/:courseSlug
 * @desc    Lấy thông tin tiến độ học tập theo SLUG
 */
router.get('/:courseSlug', progressController.getProgress);

export default router;
