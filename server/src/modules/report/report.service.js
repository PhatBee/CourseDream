// src/services/report.service.js
import Report from "../report/report.model.js";
import Course from "../course/course.model.js";
import Discussion from "../discussion/discussion.model.js";
import notificationService from "../notification/notification.service.js"; // ← THAY ĐỔI

// Helper: lấy instructor từ discussion
const getInstructorFromDiscussion = async (discussionId) => {
  const discussion = await Discussion.findById(discussionId)
    .populate({ path: "course", select: "instructor title" });
  return discussion?.course?.instructor;
};

export const createReport = async (courseId, reporterId, reason) => {
  const report = await Report.create({
    course: courseId,
    reporter: reporterId,
    reason,
  });

  const course = await Course.findById(courseId).populate("instructor", "name email");

  if (course.instructor) {
    await notificationService.createNotification({
      recipient: course.instructor._id,
      sender: reporterId,
      type: "report",
      title: `Báo cáo mới từ khóa học: ${course.title}`,
      message: `Học viên báo cáo: "${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}"`,
      relatedId: report._id,
    });
  }

  return report;
};

// 2. Báo cáo toàn bộ discussion
export const createDiscussionReport = async (discussionId, reporterId, reason) => {
  const discussion = await Discussion.findById(discussionId).select("course");
  if (!discussion) throw new Error("Thảo luận không tồn tại");

  const report = await Report.create({
    course: discussion.course,
    discussion: discussionId,
    reporter: reporterId,
    reason,
  });

  const instructorId = await getInstructorFromDiscussion(discussionId);
  if (instructorId) {
    await notificationService.createNotification({
      recipient: instructorId,
      sender: reporterId,
      type: "report",
      title: "Báo cáo thảo luận trong khóa học của bạn",
      message: `Học viên báo cáo chủ đề thảo luận: "${reason.substring(0, 80)}..."`,
      relatedId: report._id,
    });
  }

  return report;
};

// 3. Báo cáo reply cụ thể
export const createReplyReport = async (replyId, reporterId, reason) => {
  const discussion = await Discussion.findOne({ "replies._id": replyId });
  if (!discussion) throw new Error("Bình luận không tồn tại");

  const report = await Report.create({
    course: discussion.course,
    discussion: discussion._id,
    reply: replyId,
    reporter: reporterId,
    reason,
  });

  const instructorId = await getInstructorFromDiscussion(discussion._id);
  if (instructorId) {
    await notificationService.createNotification({
      recipient: instructorId,
      sender: reporterId,
      type: "report",
      title: "Báo cáo bình luận trong khóa học của bạn",
      message: `Học viên báo cáo một bình luận: "${reason.substring(0, 80)}..."`,
      relatedId: report._id,
    });
  }

  return report;
};