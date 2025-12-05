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

export const courseApi = {
  getAllCourses,
  getDetailsBySlug,
  uploadVideo,
  createCourse,
  searchCourses,
  getLevels,
  getCourseStats,
};