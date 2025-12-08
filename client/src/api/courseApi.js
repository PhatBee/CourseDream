import axiosClient from "./axiosClient";

const path = "/courses";

export const getAllCourses = (params) => {
  return axiosClient.get(path, { params });
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

// ==================== ADMIN APIs ====================

const getPendingCourses = (params) => {
  return axiosClient.get(`${path}/admin/pending`, { params });
};

const getPendingCourseDetail = (revisionId) => {
  return axiosClient.get(`${path}/admin/pending/${revisionId}`);
};

const approveCourse = (revisionId) => {
  return axiosClient.post(`${path}/admin/approve/${revisionId}`);
};

const rejectCourse = (revisionId, reviewMessage) => {
  return axiosClient.post(`${path}/admin/reject/${revisionId}`, { reviewMessage });
};

export const courseApi = {
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
  // Admin APIs
  getPendingCourses,
  getPendingCourseDetail,
  approveCourse,
  rejectCourse
};