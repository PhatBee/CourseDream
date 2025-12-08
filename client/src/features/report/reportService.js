import reportApi from "../../api/reportApi";

const reportService = {
  reportCourse: (courseId, reason) => reportApi.reportCourse(courseId, reason),
  reportDiscussion: (discussionId, reason) => reportApi.reportDiscussion(discussionId, reason),
  reportReply: (replyId, reason) => reportApi.reportReply(replyId, reason),
};

export default reportService;