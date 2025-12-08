import axiosClient from "./axiosClient";

// Lấy danh sách thảo luận của một khóa học
export const getDiscussionsByCourse = (courseId, page = 1, limit = 10) =>
  axiosClient.get(`/discussions/course/${courseId}?page=${page}&limit=${limit}`);

// Tạo thảo luận mới
export const createDiscussion = (courseId, content) =>
  axiosClient.post(`/discussions/course/${courseId}/create`, { content });
// Trả lời thảo luận
export const replyToDiscussion = (discussionId, content) =>
  axiosClient.post(`/discussions/reply/${discussionId}`, { content });