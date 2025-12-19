import axiosClient from './axiosClient';
const path = '/reports';

const reportApi = {
  reportCourse: (courseId, reason) =>
    axiosClient.post(`${path}/course/${courseId}`, { reason }),
  reportDiscussion: (discussionId, reason) =>
    axiosClient.post(`${path}/discussion/${discussionId}`, { reason }),
  reportReply: (replyId, reason) =>
    axiosClient.post(`${path}/reply/${replyId}`, { reason }),
};

export default reportApi;