import axiosClient from "./axiosClient";
const path = "/reports";

const reportApi = {
  reportCourse: (courseId, reason, description) =>
    axiosClient.post(`${path}/course/${courseId}`, { reason, description }),
  reportDiscussion: (discussionId, reason, description) =>
    axiosClient.post(`${path}/discussion/${discussionId}`, {
      reason,
      description,
    }),
  reportReply: (replyId, reason, description) =>
    axiosClient.post(`${path}/reply/${replyId}`, { reason, description }),
};

export default reportApi;
