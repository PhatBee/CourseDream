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

const getPopularCourses = async () => {
  try {
    const response = await courseApi.getPopularCourses();
    // Backend trả về: { success: true, data: [...] }
    if (!response.data?.data) {
      console.warn('[courseService] getPopularCourses: Unexpected response shape', response.data);
      return [];
    }
    return response.data.data;
  } catch (error) {
    // Phân biệt loại lỗi để dễ debug
    if (error.code === 'ECONNABORTED') {
      console.error('[courseService] getPopularCourses: Request timeout');
      throw new Error('Kết nối quá chậm, vui lòng thử lại.');
    }
    if (!error.response) {
      // Network error: server không phản hồi (ngrok hết hạn, server down, mất mạng)
      console.error('[courseService] getPopularCourses: Network error - no response', error.message);
      throw new Error('Không thể kết nối đến server. Kiểm tra kết nối mạng hoặc server.');
    }
    // Server trả về lỗi (4xx / 5xx)
    console.error('[courseService] getPopularCourses: Server error', error.response.status, error.response.data);
    throw error;
  }
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

// ==================== ADMIN SERVICES ====================

const courseService = {
  getPopularCourses,
  getDetails,
  getAllCourses,
  createCourse,
  uploadVideo,
  uploadResource,
  getInstructorCourses,
  getInstructorCourseForEdit,
  deleteCourse,
  activateCourse,
  // Admin Services
};

export default courseService;