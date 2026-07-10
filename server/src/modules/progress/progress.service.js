import Progress from './progress.model.js';
import Course from '../course/course.model.js';
import Lecture from '../course/lecture.model.js';
import notificationService from '../notification/notification.service.js';
import Enrollment from '../enrollment/enrollment.model.js';


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

export const syncProgressStatus = async (userId, courseId) => {
  const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
  if (!enrollment || !enrollment.isActivated || !enrollment.startedAt) {
    await Progress.updateOne(
      { student: userId, course: courseId },
      { $set: { scheduleStatus: 'in-progress' } }
    );
    return 'in-progress';
  }

  const course = await Course.findById(courseId).select('totalLectures durationInWeeks');
  if (!course) return 'in-progress';

  const progress = await findOrCreateProgress(userId, courseId);

  const totalLectures = course.totalLectures || 0;
  const durationInWeeks = course.durationInWeeks || 12;
  const completedCount = progress.completedLectures ? progress.completedLectures.length : 0;
  const percentage = progress.percentage || 0;

  const weeksElapsed = Math.max(0, (Date.now() - new Date(enrollment.startedAt)) / (7 * 24 * 60 * 60 * 1000));
  const learningPaceGoal = durationInWeeks > 0 ? (totalLectures / durationInWeeks) : 0;
  const E = Math.min(learningPaceGoal * weeksElapsed, totalLectures);
  const A = completedCount;

  let status = 'in-progress';
  if (A < E * 0.8 && percentage < 100) {
    status = 'behind';
  } else if (percentage >= 100) {
    status = 'completed';
  } else {
    status = 'in-progress';
  }

  progress.scheduleStatus = status;
  await progress.save();
  return status;
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
  }

  await syncProgressStatus(userId, course._id);

  return progress;
};

// ─── saveVideoProgress — Lưu thời gian xem video (gọi mỗi 10s) ─────────────
/**
 * @param {string} userId
 * @param {string} courseSlug
 * @param {string} lectureId
 * @param {number} watchedSeconds - thời điểm hiện tại (giây)
 */
export const saveVideoProgress = async (userId, courseSlug, lectureId, watchedSeconds) => {
  const course = await getCourseBySlug(courseSlug);

  // Đảm bảo progress document tồn tại
  await Progress.findOneAndUpdate(
    { student: userId, course: course._id },
    {
      $setOnInsert: {
        student: userId,
        course: course._id,
        completedLectures: [],
        watchTimes: [],
        percentage: 0,
      },
    },
    { upsert: true, new: true }
  );

  // Cập nhật watchTime nếu entry đã tồn tại
  await Progress.updateOne(
    { student: userId, course: course._id, 'watchTimes.lecture': lectureId },
    {
      $set: {
        'watchTimes.$.watchedSeconds': watchedSeconds,
        'watchTimes.$.updatedAt': new Date(),
      },
    }
  );

  // Nếu không có entry thì push mới
  const existsInDb = await Progress.findOne({
    student: userId,
    course: course._id,
    'watchTimes.lecture': lectureId,
  });

  if (!existsInDb) {
    await Progress.updateOne(
      { student: userId, course: course._id },
      {
        $push: { watchTimes: { lecture: lectureId, watchedSeconds } },
      },
      { upsert: true }
    );
  }

  // Tự động đánh dấu hoàn thành bài học nếu đạt điều kiện (Học dồn real-time)
  const lecture = await Lecture.findById(lectureId).select('duration').lean();
  if (lecture && lecture.duration > 0) {
    const isCompletedCondition = 
      (watchedSeconds >= 0.9 * lecture.duration) || 
      ((watchedSeconds / lecture.duration) * 100 >= 95);

    if (isCompletedCondition) {
      const fullProgress = await findOrCreateProgress(userId, course._id);
      const exists = fullProgress.completedLectures.some(id => id.toString() === lectureId);
      
      if (!exists) {
        fullProgress.completedLectures.push(lectureId);
        const oldPercentage = fullProgress.percentage;
        const totalLectures = course.totalLectures || 1;
        fullProgress.percentage = Math.min(
          100,
          Math.round((fullProgress.completedLectures.length / totalLectures) * 100)
        );
        await fullProgress.save();

        if (oldPercentage < 100 && fullProgress.percentage === 100) {
          await notificationService.createNotification({
            recipient: userId,
            type: "course_completed",
            title: "Chúc mừng bạn đã hoàn thành khóa học!",
            message: `Bạn đã hoàn thành xuất sắc khóa học "${course.title}". Hãy xem lại các kiến thức đã học và tiếp tục chinh phục những khóa học khác nhé!`,
            metadata: { courseTitle: course.title }
          }).catch(err => console.error("Lỗi gửi thông báo hoàn thành khóa học:", err));
        }
      }
    }
  }

  await syncProgressStatus(userId, course._id);

  const finalProgress = await Progress.findOne({ student: userId, course: course._id }).lean();
  return { lectureId, watchedSeconds, progress: finalProgress };
};

// ─── getVideoProgress — Lấy last_watched_time của một bài giảng ─────────────
/**
 * @returns {{ lectureId, watchedSeconds }}
 */
export const getVideoProgress = async (userId, courseSlug, lectureId) => {
  const course = await getCourseBySlug(courseSlug);
  const progress = await Progress.findOne(
    { student: userId, course: course._id },
    { watchTimes: 1 }
  );

  if (!progress) return { lectureId, watchedSeconds: 0 };

  const entry = progress.watchTimes.find(
    (w) => w.lecture.toString() === lectureId
  );

  return { lectureId, watchedSeconds: entry ? entry.watchedSeconds : 0 };
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

  await syncProgressStatus(userId, course._id);

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
