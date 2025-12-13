import reportApi from "../../api/reportApi";

const reportService = {
  reportCourse: async (courseId, reason) => {
    try {
      return await reportApi.reportCourse(courseId, reason);
    } catch (error) {
      // Lấy message từ backend nếu có
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  reportDiscussion: async (discussionId, reason) => {
    try {
      return await reportApi.reportDiscussion(discussionId, reason);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  reportReply: async (replyId, reason) => {
    try {
      return await reportApi.reportReply(replyId, reason);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
  //admin
  fetchReports: (params) => reportApi.getReports(params),
  fetchReportDetail: (id) => reportApi.getReportDetail(id),
  resolveReport: ({ id, ...data }) => reportApi.resolveReport(id, data),
};

export default reportService;