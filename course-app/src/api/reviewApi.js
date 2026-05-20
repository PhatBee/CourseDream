import axiosClient from "./axiosClient";
const path = "/reviews";

const reviewApi = {
  // Lấy đánh giá có hỗ trợ params (phân trang, sắp xếp)
  getCourseReviews: (courseId, params) =>
    axiosClient.get(`${path}/${courseId}/reviews`, { params }),

  // Thêm/cập nhật đánh giá
  addReview: (courseId, data) =>
    axiosClient.post(`${path}/${courseId}/reviews`, data),

  // Xóa đánh giá
  deleteReview: (reviewId) => axiosClient.delete(`${path}/${reviewId}`),

  // Thả tim và bỏ thả tim
  likeReview: (reviewId) => axiosClient.post(`${path}/${reviewId}/like`),

  // Giảng viên phản hồi
  replyReview: (reviewId, data) =>
    axiosClient.post(`${path}/${reviewId}/reply`, data),
};

export default reviewApi;
