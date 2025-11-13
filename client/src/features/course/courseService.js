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

const courseService = {
  getDetails,
};

export default courseService;