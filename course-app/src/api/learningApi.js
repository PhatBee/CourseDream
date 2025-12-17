import axiosClient from "./axiosClient";

const coursePath = "/courses";
const progressPath = "/progress";

const getCourseContent = (slug) => {
  return axiosClient.get(`${coursePath}/${slug}/learn`);
};

const getProgress = (courseSlug) => {
  return axiosClient.get(`${progressPath}/${courseSlug}`);
};

const toggleLectureCompletion = ({ courseSlug, lectureId }) => {
  return axiosClient.post(`${progressPath}/toggle`, { courseSlug, lectureId });
};

export const learningApi = {
  getCourseContent,
  getProgress,
  toggleLectureCompletion,
};