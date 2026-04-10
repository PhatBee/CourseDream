// src/features/course/courseService.js
import { courseApi } from "../../api/courseApi";

const getDetails = async (slug) => {
  const response = await courseApi.getDetailsBySlug(slug);
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

// ==================== ADMIN SERVICES ====================

const courseService = {
  getDetails,
  getAllCourses,
  createCourse,
  getInstructorCourses,
  getInstructorCourseForEdit,
  deleteCourse,
  activateCourse,
};

export default courseService;