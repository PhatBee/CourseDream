import axiosClient from "./axiosClient";

const reportApi = {
  reportCourse: (courseId, reason) =>
    axiosClient.post(`/reports/course/${courseId}`, { reason }),
  reportDiscussion: (discussionId, reason) =>
    axiosClient.post(`/reports/discussion/${discussionId}`, { reason }),
  reportReply: (replyId, reason) =>
    axiosClient.post(`/reports/reply/${replyId}`, { reason }),
};

export default reportApi;