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

export const learningApi = {
  getCourseContent,
  getProgress,
  toggleLectureCompletion,
  saveVideoProgress,
  getVideoProgress,
  submitQuizAnswer,
};