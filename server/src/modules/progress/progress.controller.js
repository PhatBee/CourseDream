import * as progressService from './progress.service.js';

// ─── GET /api/progress/:courseSlug ──────────────────────────────────────────
export const getProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug } = req.params;
    const progress = await progressService.getCourseProgress(userId, courseSlug);
    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/progress/toggle ───────────────────────────────────────────────
export const toggleLectureCompletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId } = req.body;

    if (!courseSlug || !lectureId) {
      const error = new Error('Thiếu courseSlug hoặc lectureId');
      error.statusCode = 400;
      throw error;
    }

    const result = await progressService.toggleLectureCompletion(userId, courseSlug, lectureId);
    res.status(200).json({
      success: true,
      message: 'Cập nhật tiến độ thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/progress/video ─────────────────────────────────────────────────
/**
 * @route   POST /api/progress/video
 * @desc    Lưu thời gian xem video (gọi định kỳ mỗi 10s)
 * @body    { courseSlug, lectureId, watchedSeconds }
 */
export const saveVideoProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId, watchedSeconds } = req.body;

    if (!courseSlug || !lectureId || watchedSeconds == null) {
      const error = new Error('Thiếu courseSlug, lectureId hoặc watchedSeconds');
      error.statusCode = 400;
      throw error;
    }

    const parsed = parseFloat(watchedSeconds);
    if (isNaN(parsed) || parsed < 0) {
      const error = new Error('watchedSeconds không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const result = await progressService.saveVideoProgress(userId, courseSlug, lectureId, parsed);
    res.status(200).json({
      success: true,
      message: 'Đã lưu tiến độ video',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/progress/video/:courseSlug/:lectureId ──────────────────────────
/**
 * @route   GET /api/progress/video/:courseSlug/:lectureId
 * @desc    Lấy last_watched_time của một bài giảng
 */
export const getVideoProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId } = req.params;

    const result = await progressService.getVideoProgress(userId, courseSlug, lectureId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};