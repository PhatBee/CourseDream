import axiosClient from "./axiosClient";

const path = "/courses";

export const getAllCourses = (params) => {
  return axiosClient.get(path, { params });
};

export const getPopularCourses = () => {
  return axiosClient.get(`${path}/popular`);
};

const getDetailsBySlug = (slug) => {
  return axiosClient.get(`${path}/${slug}`);
};

// API Mới: Upload Video
const uploadVideo = (formData) => {
  return axiosClient.post(`${path}/upload-video`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

const uploadResource = (formData) => {
  return axiosClient.post('/courses/upload-resource', formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

// API Mới: Tạo khóa học
const createCourse = (formData) => {
  return axiosClient.post(path, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const searchCourses = (params) => {
  return axiosClient.get("/courses/search", { params });
};

const getLevels = () => axiosClient.get("/courses/levels");

const getCourseStats = () => axiosClient.get("/courses/stats");

// API lấy khóa học của Instructor
const getInstructorCourses = (params) => {
  return axiosClient.get(`${path}/instructor/my-courses`, { params });
};

const getInstructorCourseForEdit = (slug) => {
  return axiosClient.get(`/courses/instructor/edit/${slug}`);
};

const deleteCourse = (id) => {
  return axiosClient.delete(`${path}/${id}`);
};

const activateCourse = (id) => {
  return axiosClient.patch(`${path}/${id}/activate`);
};

// ==================== VIDEO PLAYBACK APIs (CloudFront Signed URL) ====================

/**
 * Lấy CloudFront Signed URL để phát video bài giảng
 * @param {string} courseId - Mongo ID của Course
 * @param {string} lectureId - Mongo ID của Lecture
 * @returns {{ videoUrl, duration, title, expiresIn }}
 */
const getVideoPlayUrl = (courseId, lectureId) => {
  return axiosClient.get(`${path}/${courseId}/lectures/${lectureId}/play`);
};

/**
 * Lấy preview intro video URL của khóa học
 * @param {string} slug - slug của khóa học
 * @returns {{ previewUrl, thumbnail }}
 */
const getCoursePreviewUrl = (slug) => {
  return axiosClient.get(`${path}/${slug}/preview-url`);
};

// ==================== ADMIN APIs ====================

export const courseApi = {
  getPopularCourses,
  getAllCourses,
  getDetailsBySlug,
  uploadVideo,
  uploadResource,
  createCourse,
  searchCourses,
  getLevels,
  getCourseStats,
  getInstructorCourses,
  getInstructorCourseForEdit,
  deleteCourse,
  activateCourse,
  // Video Playback (CloudFront Signed URL)
  getVideoPlayUrl,
  getCoursePreviewUrl,
};