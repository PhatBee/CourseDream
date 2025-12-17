import * as reviewApi from "../../api/reviewApi";

const reviewService = {
  getReviews: async (courseId) => {
    const res = await reviewApi.getReviews(courseId);
    return res.data; // Chỉ trả về dữ liệu
  },
  addReview: async (courseId, data) => {
    const res = await reviewApi.postReview(courseId, data);
    return res.data; // Chỉ trả về dữ liệu
  },
};

export default reviewService;