import axiosClient from "./axiosClient";

// Lấy danh sách thảo luận của một khóa học (Đã có)
export const getDiscussionsByCourse = (
  courseId,
  lectureId,
  page = 1,
  limit = 10,
) => {
  let url = `/discussions?courseId=${courseId}&page=${page}&limit=${limit}`;
  if (lectureId) url += `&lectureId=${lectureId}`;
  return axiosClient.get(url);
};

// Tạo thảo luận mới (Đã có)
export const createDiscussion = (courseId, lectureId, title, content) =>
  axiosClient.post(`/discussions`, { courseId, lectureId, title, content });

// Trả lời thảo luận (Đã có)
export const replyToDiscussion = (discussionId, content) =>
  axiosClient.post(`/discussions/${discussionId}/replies`, { content });

// ================= CÁC API BỔ SUNG =================

// Lấy chi tiết một thảo luận
export const getDiscussionById = (discussionId) =>
  axiosClient.get(`/discussions/${discussionId}`);

// Upvote thảo luận hoặc Câu trả lời
// targetType: 'DISCUSSION' hoặc 'ANSWER'
export const voteDiscussion = (discussionId, targetType, targetId = null) => {
  const payload = { targetType };
  if (targetId) payload.targetId = targetId;
  return axiosClient.patch(`/discussions/${discussionId}/vote`, payload);
};

// Đánh dấu câu trả lời hay nhất (Dành cho Giảng viên/Tác giả)
export const markBestAnswer = (discussionId, replyId) =>
  axiosClient.patch(`/discussions/${discussionId}/best-answer`, { replyId });

// Xóa thảo luận (Soft Delete - Dành cho Giảng viên/Admin/Tác giả)
export const deleteDiscussion = (discussionId) =>
  axiosClient.delete(`/discussions/${discussionId}`);
