// src/api/reviewApi.js
import axiosClient from "./axiosClient";

export const postReview = (courseId, data) => axiosClient.post(`/reviews/${courseId}`, data);
export const getReviews = (courseId) => axiosClient.get(`/reviews/${courseId}`);