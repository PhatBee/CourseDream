import axiosClient from "./axiosClient";
const path = "/discussions";

const discussionApi = {
  getDiscussions: (courseId, lectureId = "", page = 1, limit = 10) => {
    let url = `${path}?courseId=${courseId}&page=${page}&limit=${limit}`;
    if (lectureId) url += `&lectureId=${lectureId}`;
    return axiosClient.get(url);
  },
  getDiscussionById: (discussionId) =>
    axiosClient.get(`${path}/${discussionId}`),
  addDiscussion: (courseId, lectureId, title, content) =>
    axiosClient.post(`${path}`, { courseId, lectureId, title, content }),
  replyDiscussion: (discussionId, content) =>
    axiosClient.post(`${path}/${discussionId}/replies`, { content }),
  voteDiscussion: (discussionId, targetType, targetId = null) => {
    const payload = { targetType };
    if (targetId) payload.targetId = targetId;
    return axiosClient.patch(`${path}/${discussionId}/vote`, payload);
  },
  markBestAnswer: (discussionId, replyId) =>
    axiosClient.patch(`${path}/${discussionId}/best-answer`, { replyId }),
  deleteDiscussion: (discussionId) =>
    axiosClient.delete(`${path}/${discussionId}`),
  getDiscussionReplies: (discussionId, page = 1, limit = 5) =>
    axiosClient.get(
      `${path}/${discussionId}/replies?page=${page}&limit=${limit}`,
    ),
  deleteReply: (replyId) =>
    axiosClient.delete(`${path}/replies/${replyId}`),
};

export default discussionApi;
