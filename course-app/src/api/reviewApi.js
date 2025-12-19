import axiosClient from './axiosClient';
const path = '/reviews';

const reviewApi = {
  getCourseReviews: (courseId) => axiosClient.get(`${path}/${courseId}`),
  addReview: (courseId, data) => axiosClient.post(`${path}/${courseId}`, data),
};

export default reviewApi;