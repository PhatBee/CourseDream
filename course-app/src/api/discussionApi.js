import axiosClient from './axiosClient';
const path = '/discussions';

const discussionApi = {
  getDiscussions: (courseId, page = 1, limit = 10) =>
    axiosClient.get(`${path}/course/${courseId}?page=${page}&limit=${limit}`),
  addDiscussion: (courseId, content) =>
    axiosClient.post(`${path}/course/${courseId}/create`, { content }),
  replyDiscussion: (discussionId, content) =>
    axiosClient.post(`${path}/reply/${discussionId}`, { content }),
};

export default discussionApi;