import * as reviewApi from "../../api/reviewApi";

const reviewService = {
  getReviews: async (courseId, params) => {
    const res = await reviewApi.getReviews(courseId, params);
    return res.data; // Backend mới trả về { data, total, page, limit }
  },
  addReview: async (courseId, data) => {
    const res = await reviewApi.postReview(courseId, data);
    return res.data;
  },
  deleteReview: async (reviewId) => {
    const res = await reviewApi.deleteReview(reviewId);
    return res.data;
  },
  likeReview: async (reviewId) => {
    const res = await reviewApi.likeReview(reviewId);
    return res.data; // { message, likesCount }
  },
  replyReview: async (reviewId, data) => {
    const res = await reviewApi.replyReview(reviewId, data);
    return res.data; // { message, review }
  },
};

export default reviewService;
