// client/src/api/reviewApi.js
import axiosClient from "./axiosClient";

export const getReviews = (courseId, params) =>
  axiosClient.get(`/reviews/${courseId}/reviews`, { params });
export const postReview = (courseId, data) =>
  axiosClient.post(`/reviews/${courseId}/reviews`, data);
export const deleteReview = (reviewId) =>
  axiosClient.delete(`/reviews/${reviewId}`);
export const likeReview = (reviewId) =>
  axiosClient.post(`/reviews/${reviewId}/like`);
export const replyReview = (reviewId, data) =>
  axiosClient.post(`/reviews/${reviewId}/reply`, data);
