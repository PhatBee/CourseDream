import axiosClient from "./axiosClient";

const coursePath = "/courses";
const progressPath = "/progress";

// ─── Course content ───────────────────────────────────────────────────────────
const getCourseContent = (slug) => {
  return axiosClient.get(`${coursePath}/${slug}/learn`);
};

// ─── Lecture completion toggle ────────────────────────────────────────────────
const getProgress = (courseSlug) => {
  return axiosClient.get(`${progressPath}/${courseSlug}`);
};

const toggleLectureCompletion = ({ courseSlug, lectureId }) => {
  return axiosClient.post(`${progressPath}/toggle`, { courseSlug, lectureId });
};

// ─── Video progress tracking ──────────────────────────────────────────────────

/**
 * Lưu thời gian xem video (gọi định kỳ mỗi 10s)
 * @param {{ courseSlug, lectureId, watchedSeconds }} params
 */
const saveVideoProgress = ({ courseSlug, lectureId, watchedSeconds }) => {
  return axiosClient.post(`${progressPath}/video`, {
    courseSlug,
    lectureId,
    watchedSeconds,
  });
};

/**
 * Lấy last_watched_time của một bài giảng
 * @param {string} courseSlug
 * @param {string} lectureId
 */
const getVideoProgress = (courseSlug, lectureId) => {
  return axiosClient.get(`${progressPath}/video/${courseSlug}/${lectureId}`);
};

// ─── Quiz ─────────────────────────────────────────────────────────────────────
const submitQuizAnswer = ({ courseSlug, lectureId, quizIndex, answer }) => {
  return axiosClient.post(`${progressPath}/quiz-answer`, {
    courseSlug,
    lectureId,
    quizIndex,
    answer,
  });
};

/**
 * Reset 1 quiz cụ thể để làm lại
 */
const resetQuiz = ({ courseSlug, lectureId, quizIndex }) => {
  return axiosClient.delete(`${progressPath}/quiz-reset`, {
    data: { courseSlug, lectureId, quizIndex },
  });
};

/**
 * Reset tất cả quiz của 1 bài giảng
 */
const resetAllQuizzes = ({ courseSlug, lectureId }) => {
  return axiosClient.delete(`${progressPath}/quiz-reset-all`, {
    data: { courseSlug, lectureId },
  });
};

/**
 * Lấy lịch sử quiz đã làm của 1 bài giảng
 */
const getQuizHistory = (courseSlug, lectureId) => {
  return axiosClient.get(`${progressPath}/quiz-history/${courseSlug}/${lectureId}`);
};

export const learningApi = {
  getCourseContent,
  getProgress,
  toggleLectureCompletion,
  saveVideoProgress,
  getVideoProgress,
  submitQuizAnswer,
  resetQuiz,
  resetAllQuizzes,
  getQuizHistory,
};
