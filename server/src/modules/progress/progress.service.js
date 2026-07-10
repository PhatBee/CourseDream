import Progress from './progress.model.js';
import Course from '../course/course.model.js';
import Lecture from '../course/lecture.model.js';
import notificationService from '../notification/notification.service.js';
import { generateCourseCompletionReward } from '../promotion/reward.service.js';


const getCourseBySlug = async (slug) => {
  const course = await Course.findOne({ slug }).select('_id title totalLectures');
  if (!course) {
    const error = new Error('Khóa học không tồn tại.');
    error.statusCode = 404;
    throw error;
  }
  return course;
};

// ─── Helper: tìm/tạo progress record ────────────────────────────────────────
const findOrCreateProgress = async (userId, courseId) => {
  let progress = await Progress.findOne({ student: userId, course: courseId });
  if (!progress) {
    progress = new Progress({
      student: userId,
      course: courseId,
      completedLectures: [],
      watchTimes: [],
      percentage: 0,
    });
  }
  return progress;
};

// ─── getCourseProgress ───────────────────────────────────────────────────────
export const getCourseProgress = async (userId, courseSlug) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await findOrCreateProgress(userId, course._id);
  if (progress.isNew) await progress.save();
  return progress;
};

// ─── toggleLectureCompletion ─────────────────────────────────────────────────
export const toggleLectureCompletion = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await findOrCreateProgress(userId, course._id);

  const lectureIndex = progress.completedLectures.findIndex(
    (id) => id.toString() === lectureId
  );

  if (lectureIndex > -1) {
    progress.completedLectures.splice(lectureIndex, 1);
  } else {
    // ── ANTI-FRAUD GATE ─────────────────────────────────────────────
    const lecture = await Lecture.findById(lectureId)
      .select('duration quizzes')
      .lean();

    if (!lecture) {
      const err = new Error('Bài giảng không tồn tại');
      err.statusCode = 404;
      throw err;
    }

    const activeQuizzes = (lecture.quizzes || []).filter(q => q.isActive !== false);
    const hasVideo = (lecture.duration || 0) > 0;
    const MIN_WATCH_RATIO = 0.7; // Yêu cầu của người dùng là 70%

    // Kiểm tra 1: Toàn bộ Quiz active phải được trả lời đúng
    if (activeQuizzes.length > 0) {
      const correctlyAnswered = (progress.completedQuizzes || []).filter(
        q => String(q.lectureId) === String(lectureId) && q.isCorrect === true
      );
      const allQuizPassed = activeQuizzes.every((_, idx) =>
        correctlyAnswered.some(q => q.quizIndex === idx)
      );
      if (!allQuizPassed) {
        const err = new Error('Bạn cần trả lời đúng tất cả câu hỏi trong bài giảng trước khi hoàn thành.');
        err.statusCode = 403;
        throw err;
      }
    }

    // Kiểm tra 2: Phải xem học tập thực tế ít nhất 70% thời lượng video (chống tua)
    if (hasVideo) {
      const watchEntry = (progress.watchTimes || []).find(
        w => w.lecture.toString() === String(lectureId)
      );
      const segments = watchEntry?.watchedSegments || [];
      const accumulatedSeconds = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
      const minRequired = Math.floor(lecture.duration * MIN_WATCH_RATIO);
      if (accumulatedSeconds < minRequired) {
        const err = new Error(
          `Bạn cần xem học tập thực tế ít nhất 70% thời lượng video (${minRequired}s) trước khi đánh dấu hoàn thành. Thời gian đã học: ${Math.round(accumulatedSeconds)}s.`
        );
        err.statusCode = 403;
        throw err;
      }
    }
    // ── END ANTI-FRAUD GATE ─────────────────────────────────────────

    progress.completedLectures.push(lectureId);
  }

  const oldPercentage = progress.percentage;
  const totalLectures = course.totalLectures || 1;
  progress.percentage = Math.min(
    100,
    Math.round((progress.completedLectures.length / totalLectures) * 100)
  );

  await progress.save();

  if (oldPercentage < 100 && progress.percentage === 100) {
    await notificationService.createNotification({
      recipient: userId,
      type: "course_completed",
      title: "Chúc mừng bạn đã hoàn thành khóa học!",
      message: `Bạn đã hoàn thành xuất sắc khóa học "${course.title}". Hãy xem lại các kiến thức đã học và tiếp tục chinh phục những khóa học khác nhé!`,
      metadata: { courseTitle: course.title }
    }).catch(err => console.error("Lỗi gửi thông báo hoàn thành khóa học:", err));

    // Tự động sinh mã voucher ưu đãi đặc quyền
    generateCourseCompletionReward(userId, course._id)
      .then(async (reward) => {
        if (reward) {
          await notificationService.createNotification({
            recipient: userId,
            type: "reward_voucher",
            title: "Bạn nhận được voucher ưu đãi đặc quyền!",
            message: `Cảm ơn bạn đã hoàn thành khóa học "${course.title}" đúng hạn. Bạn nhận được mã giảm giá 7% đặc quyền cho tất cả khóa học tiếp theo: ${reward.code} (Hạn sử dụng trong 7 ngày).`,
            metadata: {
              voucherCode: reward.code,
              discountValue: reward.discountValue,
              discountType: reward.discountType,
              expiredAt: reward.endDate,
              courseTitle: course.title,
              sourceType: 'course_completion_reward'
            }
          }).catch(err => console.error("Lỗi gửi thông báo voucher phần thưởng:", err));
        }
      })
      .catch(err => console.error("Lỗi xử lý voucher phần thưởng:", err));
  }

  return progress;
};

// Helper: Hợp nhất các phân đoạn video chồng lấn hoặc nối tiếp nhau
const mergeSegments = (segments) => {
  if (segments.length <= 1) return segments;

  // Clone mảng và sắp xếp tăng dần theo điểm bắt đầu
  const sorted = [...segments].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Có phần chồng lấn hoặc tiếp giáp -> gộp lại
      last.end = Math.max(last.end, current.end);
    } else {
      // Không chồng lấn -> thêm phân đoạn mới
      merged.push(current);
    }
  }
  return merged;
};

// Helper: Tính tổng thời gian đã xem từ mảng phân đoạn
const getSegmentsDuration = (segments) => {
  return segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);
};

// ─── saveVideoProgress — Lưu thời gian xem video (gọi mỗi 10s) ─────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {number} watchedSeconds - thời điểm hiện tại (giây)
 */
export const saveVideoProgress = async (userId, courseSlug, lectureId, watchedSeconds, playbackRate = 1.0) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await findOrCreateProgress(userId, course._id);

  const lecture = await Lecture.findById(lectureId).select('duration').lean();
  const duration = lecture?.duration || 0;

  const watchEntryIndex = progress.watchTimes.findIndex(
    (w) => w.lecture.toString() === lectureId
  );

  const now = new Date();
  let segments = [];

  if (watchEntryIndex > -1) {
    const entry = progress.watchTimes[watchEntryIndex];
    const oldPlayhead = entry.watchedSeconds || 0;
    segments = entry.watchedSegments || [];
    const oldUpdatedAt = entry.updatedAt ? new Date(entry.updatedAt) : now;

    const playheadDiff = watchedSeconds - oldPlayhead;
    const realTimeElapsed = (now.getTime() - oldUpdatedAt.getTime()) / 1000;

    // Giới hạn khoảng nhảy playhead cho phép theo tốc độ phát (playbackRate)
    const maxAllowedDiff = realTimeElapsed * playbackRate + 3;

    if (playheadDiff > 0) {
      if (playheadDiff <= maxAllowedDiff) {
        // Xem bình thường (không tua, có tính đến tốc độ playbackRate)
        const segStart = Math.max(0, Math.min(oldPlayhead, duration));
        const segEnd = Math.max(0, Math.min(watchedSeconds, duration));
        if (segEnd > segStart) {
          segments.push({ start: segStart, end: segEnd });
        }
      } else {
        // Học viên tua video nhanh về phía trước: 
        // 1. Vẫn ghi nhận thời lượng xem thực tế trôi qua trước khi tua
        const segStart = Math.max(0, Math.min(oldPlayhead, duration));
        const segEnd = Math.max(0, Math.min(oldPlayhead + Math.max(0, realTimeElapsed * playbackRate), duration));
        if (segEnd > segStart) {
          segments.push({ start: segStart, end: segEnd });
        }
        // 2. Playhead vẫn cập nhật lên mốc tua mới để tính tiếp ở lần sau từ điểm tua
      }
      segments = mergeSegments(segments);
    }

    // Luôn lưu playhead currentTime hiện tại
    progress.watchTimes[watchEntryIndex].watchedSeconds = Math.min(watchedSeconds, duration);
    progress.watchTimes[watchEntryIndex].watchedSegments = segments;
    progress.watchTimes[watchEntryIndex].updatedAt = now;
  } else {
    // Xem lần đầu: Nếu playhead <= 15s thì coi như xem bình thường từ đầu
    const segEnd = Math.min(watchedSeconds, duration);
    if (watchedSeconds > 0) {
      if (watchedSeconds <= 15) {
        segments.push({ start: 0, end: segEnd });
      } else {
        // Tua ngay từ đầu: chỉ tạo 1 phân đoạn nhỏ ở điểm đích
        segments.push({ start: Math.max(0, segEnd - 1), end: segEnd });
      }
    }
    progress.watchTimes.push({
      lecture: lectureId,
      watchedSeconds: segEnd,
      watchedSegments: segments,
      updatedAt: now
    });
  }

  await progress.save();
  const accumulatedSeconds = getSegmentsDuration(segments);

  return { lectureId, watchedSeconds: Math.min(watchedSeconds, duration), accumulatedSeconds };
};

// ─── getVideoProgress — Lấy last_watched_time của một bài giảng ─────────────
/**
 * @returns {{ lectureId, watchedSeconds, accumulatedSeconds }}
 */
export const getVideoProgress = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await Progress.findOne(
    { student: userId, course: course._id },
    { watchTimes: 1 }
  );

  if (!progress) return { lectureId, watchedSeconds: 0, accumulatedSeconds: 0 };

  const entry = progress.watchTimes.find(
    (w) => w.lecture.toString() === lectureId
  );

  const segments = entry ? (entry.watchedSegments || []) : [];
  const accumulatedSeconds = getSegmentsDuration(segments);

  return {
    lectureId,
    watchedSeconds: entry ? (entry.watchedSeconds || 0) : 0,
    accumulatedSeconds
  };
};

// ─── submitQuizAnswer — Kiểm tra đáp án quiz & lưu tiến độ ─────────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {number} quizIndex   - vị trí quiz trong lecture.quizzes[]
 * @param {string} answer      - 'A' | 'B' | 'C' | 'D'
 * @returns {{ correct: boolean, hint: string|null, message: string }}
 */
export const submitQuizAnswer = async (userId, courseSlug, lectureId, quizIndex, answer) => {
  // 1. Tìm lecture
  const lecture = await Lecture.findById(lectureId).select('quizzes').lean();
  if (!lecture) {
    const error = new Error('Bài giảng không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  const quiz = lecture.quizzes?.[quizIndex];
  if (!quiz || !quiz.isActive) {
    const error = new Error('Câu hỏi không tồn tại hoặc đã bị vô hiệu hoá');
    error.statusCode = 404;
    throw error;
  }

  // 2. So sánh đáp án — KHÔNG trả về correctAnswer nếu sai
  const correct = quiz.correctAnswer === answer;
  const course = await getCourseBySlug(courseSlug);

  // 3. Đảm bảo progress document tồn tại
  await Progress.findOneAndUpdate(
    { student: userId, course: course._id },
    {
      $setOnInsert: {
        student: userId,
        course: course._id,
        completedLectures: [],
        watchTimes: [],
        completedQuizzes: [],
        percentage: 0,
      }
    },
    { upsert: true, new: true }
  );

  // 4. Kiểm tra đã có entry cho quiz này chưa
  const existingProgress = await Progress.findOne({
    student: userId,
    course: course._id,
    'completedQuizzes.lectureId': lectureId,
    'completedQuizzes.quizIndex': quizIndex,
  });

  if (existingProgress) {
    // Đã có entry → cập nhật (tăng attempts, update answer)
    await Progress.updateOne(
      {
        student: userId,
        course: course._id,
        'completedQuizzes.lectureId': lectureId,
        'completedQuizzes.quizIndex': quizIndex,
      },
      {
        $set: {
          'completedQuizzes.$.selectedAnswer': answer,
          'completedQuizzes.$.isCorrect': correct,
          'completedQuizzes.$.answeredAt': new Date(),
        },
        $inc: {
          'completedQuizzes.$.attempts': 1,
        },
      }
    );
  } else {
    // Chưa có entry → push mới
    await Progress.findOneAndUpdate(
      { student: userId, course: course._id },
      {
        $push: {
          completedQuizzes: {
            lectureId,
            quizIndex,
            selectedAnswer: answer,
            isCorrect: correct,
            attempts: 1,
            answeredAt: new Date(),
          },
        },
      },
      { new: true }
    );
  }

  return {
    correct,
    // Chỉ trả hint khi sai — không bao giờ tiết lộ correctAnswer
    hint: correct ? null : (quiz.hint || null),
    message: correct ? 'Chính xác! Tiếp tục xem video.' : 'Chưa đúng, hãy thử lại!',
  };
};

// ─── resetQuiz — Reset 1 quiz cụ thể để làm lại ─────────────────────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {number} quizIndex
 */
export const resetQuiz = async (userId, courseSlug, lectureId, quizIndex) => {
  const course = await getCourseBySlug(courseSlug);

  const result = await Progress.findOneAndUpdate(
    { student: userId, course: course._id },
    {
      $pull: {
        completedQuizzes: { lectureId, quizIndex },
      },
    },
    { new: true }
  );

  if (!result) {
    const error = new Error('Không tìm thấy tiến độ học tập');
    error.statusCode = 404;
    throw error;
  }

  return {
    message: `Đã reset quiz #${quizIndex + 1}. Bạn có thể làm lại.`,
    completedQuizzes: result.completedQuizzes,
  };
};

// ─── resetAllQuizzes — Reset toàn bộ quiz của 1 lecture ──────────────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 */
export const resetAllQuizzes = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);

  const result = await Progress.findOneAndUpdate(
    { student: userId, course: course._id },
    {
      $pull: {
        completedQuizzes: { lectureId },
      },
    },
    { new: true }
  );

  if (!result) {
    const error = new Error('Không tìm thấy tiến độ học tập');
    error.statusCode = 404;
    throw error;
  }

  return {
    message: 'Đã reset tất cả quiz trong bài giảng này.',
    completedQuizzes: result.completedQuizzes,
  };
};

// ─── getQuizHistory — Lấy lịch sử quiz đã làm cho 1 lecture ─────────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @returns {{ quizHistory: Array }}
 */
export const getQuizHistory = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await Progress.findOne(
    { student: userId, course: course._id },
    { completedQuizzes: 1 }
  );

  if (!progress) return { quizHistory: [] };

  const history = progress.completedQuizzes.filter(
    q => String(q.lectureId) === String(lectureId)
  );

  return { quizHistory: history };
};


// ─── getQuizReview — Dữ liệu đầy đủ cho Review Mode ─────────────────────────
/**
 * Join completedQuizzes (Progress) với quizzes (Lecture) để render Review UI.
 *
 * ⚠️ SECURITY: Chỉ tiết lộ correctAnswer và explanation khi quiz đã được
 *    ghi nhận trong completedQuizzes của user (đã trả lời). Không bao giờ
 *    trả về correctAnswer cho quiz chưa làm.
 *
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @returns {{ reviewData: Array, lectureId: string }}
 */
export const getQuizReview = async (userId, courseSlug, lectureId) => {
  // 1. Lấy dữ liệu lecture (câu hỏi + đáp án đúng + giải thích)
  const lecture = await Lecture.findById(lectureId)
    .select('quizzes')
    .lean();

  if (!lecture) {
    const err = new Error('Bài giảng không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  // 2. Lấy lịch sử làm bài từ Progress
  const course = await getCourseBySlug(courseSlug);
  const progress = await Progress.findOne(
    { student: userId, course: course._id },
    { completedQuizzes: 1 }
  );

  // 3. Build map: quizIndex → attemptData (chỉ cho lecture này)
  const attemptMap = {};
  if (progress?.completedQuizzes) {
    progress.completedQuizzes
      .filter(q => String(q.lectureId) === String(lectureId))
      .forEach(q => {
        attemptMap[q.quizIndex] = {
          selectedAnswer: q.selectedAnswer,
          isCorrect:      q.isCorrect,
          attempts:       q.attempts,
          answeredAt:     q.answeredAt,
        };
      });
  }

  // 4. Merge: quiz từ lecture + attempt data từ progress
  //    ⚠️ CHỈ trả về correctAnswer nếu user đã làm quiz đó
  const reviewData = (lecture.quizzes || []).map((quiz, idx) => {
    const attempt = attemptMap[idx];
    const hasAttempted = Boolean(attempt);

    return {
      quizIndex:      idx,
      question:       quiz.question,
      options:        quiz.options,
      timestamp:      quiz.timestamp,
      isActive:       quiz.isActive,
      // Gợi ý: chỉ trả về khi đã làm (tránh user dùng hint để đoán mà không thử)
      hint:           hasAttempted ? (quiz.hint || null) : null,
      // ⚠️ SECURITY: Chỉ reveal correctAnswer sau khi đã trả lời
      correctAnswer:  hasAttempted ? quiz.correctAnswer : null,
      explanation:    hasAttempted ? (quiz.explanation || null) : null,
      // Attempt data (null nếu chưa làm)
      attempt:        hasAttempted ? attempt : null,
    };
  });

  return { reviewData, lectureId };
};
