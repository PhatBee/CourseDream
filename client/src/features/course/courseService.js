import { courseApi } from "../../api/courseApi";

/**
 * Gọi API để lấy chi tiết khóa học
 * @param {string} slug - Slug của khóa học
 * @returns {Promise<object>} - Dữ liệu trả về từ API (data: { course, reviews, ... })
 */
const getDetails = async (slug) => {
  const response = await courseApi.getDetailsBySlug(slug);

  // Backend trả về: { success: true, data: { course, reviews, ... } }
  return response.data.data;
};

const getAllCourses = async (params) => {
  const response = await courseApi.getAllCourses(params);
  return response.data;
};

const createCourse = async (formData) => {
  const response = await courseApi.createCourse(formData);
  return response.data;
};

const uploadVideo = async (formData) => {
  const response = await courseApi.uploadVideo(formData);
  return response.data;
};

const uploadResource = async (formData) => {
  const response = await courseApi.uploadResource(formData);
  return response.data;
};

const getInstructorCourses = async (params) => {
  const response = await courseApi.getInstructorCourses(params);
  return response.data;
};

const getInstructorCourseForEdit = async (slug) => {
  const response = await courseApi.getInstructorCourseForEdit(slug);
  return response.data;
};

const deleteCourse = async (id) => {
  const response = await courseApi.deleteCourse(id);
  return response.data;
};

const activateCourse = async (id) => {
  const response = await courseApi.activateCourse(id);
  return response.data;
};

const courseService = {
  getDetails,
  getAllCourses,
  createCourse,
  uploadVideo,
  uploadResource,
  getInstructorCourses,
  getInstructorCourseForEdit,
  deleteCourse,
  activateCourse
};

export default courseService;