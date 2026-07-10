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
    const { courseSlug, lectureId, watchedSeconds, playbackRate } = req.body;

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

    // Tốc độ phát mặc định là 1.0, giới hạn tối đa là 2.0x và tối thiểu là 0.25x để chống hack gửi số lớn
    let rate = 1.0;
    if (playbackRate != null) {
      const parsedRate = parseFloat(playbackRate);
      if (!isNaN(parsedRate)) {
        rate = Math.min(2.0, Math.max(0.25, parsedRate));
      }
    }

    const result = await progressService.saveVideoProgress(userId, courseSlug, lectureId, parsed, rate);
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

// ─── POST /api/progress/quiz-answer ─────────────────────────────────────────
/**
 * @route   POST /api/progress/quiz-answer
 * @desc    Học viên submit đáp án quiz — validate server-side, KHÔNG leak correctAnswer
 * @body    { courseSlug, lectureId, quizIndex, answer }
 */
export const submitQuizAnswer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId, quizIndex, answer } = req.body;

    if (!courseSlug || !lectureId || quizIndex == null || !answer) {
      const error = new Error('Thiếu courseSlug, lectureId, quizIndex hoặc answer');
      error.statusCode = 400;
      throw error;
    }

    const validAnswers = ['A', 'B', 'C', 'D'];
    if (!validAnswers.includes(answer)) {
      const error = new Error('Đáp án không hợp lệ (phải là A, B, C hoặc D)');
      error.statusCode = 400;
      throw error;
    }

    const result = await progressService.submitQuizAnswer(
      userId,
      courseSlug,
      lectureId,
      parseInt(quizIndex),
      answer
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/progress/quiz-reset ──────────────────────────────────────────
/**
 * @route   DELETE /api/progress/quiz-reset
 * @desc    Reset 1 quiz cụ thể để làm lại
 * @body    { courseSlug, lectureId, quizIndex }
 */
export const resetQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId, quizIndex } = req.body;

    if (!courseSlug || !lectureId || quizIndex == null) {
      const error = new Error('Thiếu courseSlug, lectureId hoặc quizIndex');
      error.statusCode = 400;
      throw error;
    }

    const result = await progressService.resetQuiz(
      userId,
      courseSlug,
      lectureId,
      parseInt(quizIndex)
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/progress/quiz-reset-all ──────────────────────────────────────
/**
 * @route   DELETE /api/progress/quiz-reset-all
 * @desc    Reset tất cả quiz của 1 bài giảng
 * @body    { courseSlug, lectureId }
 */
export const resetAllQuizzes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId } = req.body;

    if (!courseSlug || !lectureId) {
      const error = new Error('Thiếu courseSlug hoặc lectureId');
      error.statusCode = 400;
      throw error;
    }

    const result = await progressService.resetAllQuizzes(
      userId,
      courseSlug,
      lectureId
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/progress/quiz-history/:courseSlug/:lectureId ────────────────────
/**
 * @route   GET /api/progress/quiz-history/:courseSlug/:lectureId
 * @desc    Lấy lịch sử quiz đã làm của 1 bài giảng
 */
export const getQuizHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId } = req.params;

    const result = await progressService.getQuizHistory(
      userId,
      courseSlug,
      lectureId
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/progress/quiz-review/:courseSlug/:lectureId ─────────────────────
/**
 * @route   GET /api/progress/quiz-review/:courseSlug/:lectureId
 * @desc    Lấy dữ liệu đầy đủ cho Review Mode:
 *          - Toàn bộ câu hỏi (kể cả chưa làm)
 *          - Đáp án đã chọn, đáp án đúng, giải thích — CHỈ cho quiz đã làm
 * @security Yêu cầu đăng nhập. correctAnswer chỉ trả về cho quiz đã trả lời.
 */
export const getQuizReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseSlug, lectureId } = req.params;

    if (!courseSlug || !lectureId) {
      const error = new Error('Thiếu courseSlug hoặc lectureId');
      error.statusCode = 400;
      throw error;
    }

    const result = await progressService.getQuizReview(userId, courseSlug, lectureId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/progress/sync ──────────────────────────────────────────────────
export const syncProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      const error = new Error('Thiếu courseId');
      error.statusCode = 400;
      throw error;
    }

    const status = await progressService.syncProgressStatus(userId, courseId);
    res.status(200).json({
      success: true,
      message: 'Đồng bộ tiến độ học tập thành công',
      data: { scheduleStatus: status }
    });
  } catch (error) {
    next(error);
  }
};