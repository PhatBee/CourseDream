import axiosClient from "./axiosClient";

const reportApi = {
  reportCourse: (courseId, reason, description) =>
    axiosClient.post(`/reports/course/${courseId}`, { reason, description }),
  reportDiscussion: (discussionId, reason, description) =>
    axiosClient.post(`/reports/discussion/${discussionId}`, {
      reason,
      description,
    }),
  reportReply: (replyId, reason, description) =>
    axiosClient.post(`/reports/reply/${replyId}`, { reason, description }),
  //admin
  getReports: (params) =>
    axiosClient
      .get("/reports/admin/reports", { params })
      .then((res) => res.data),
  getReportDetail: (id) =>
    axiosClient.get(`/reports/admin/reports/${id}`).then((res) => res.data),
  resolveReport: (id, data) =>
    axiosClient
      .put(`/reports/admin/reports/${id}`, data)
      .then((res) => res.data),
};

export default reportApi;
