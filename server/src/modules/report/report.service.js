// src/services/report.service.js
import Report from "../report/report.model.js";
import Course from "../course/course.model.js";
import Discussion from "../discussion/discussion.model.js";
import User from "../auth/auth.model.js";
import notificationService from "../notification/notification.service.js";

// Helper: lấy instructor từ discussion
const getInstructorFromDiscussion = async (discussionId) => {
  const discussion = await Discussion.findById(discussionId)
    .populate({ path: "course", select: "instructor title" });
  return discussion?.course?.instructor;
};

// 1. Gửi báo cáo khóa học
export const createReport = async (courseId, reporterId, reason) => {
  const course = await Course.findById(courseId).populate("instructor", "name email");
  // Ràng buộc: không cho báo cáo khóa học của mình
  if (course?.instructor?._id?.toString() === reporterId.toString()) {
    throw new Error("Bạn không thể báo cáo khóa học của chính mình.");
  }
  const report = await Report.create({
    course: courseId,
    reporter: reporterId,
    reportedUser: course?.instructor?._id,
    reason,
  });

  // Gửi thông báo cho tất cả admin
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(admins.map(admin =>
    notificationService.createNotification({
      recipient: admin._id,
      sender: reporterId,
      type: "report",
      title: "...", // Tùy loại báo cáo
      message: `Có một báo cáo mới: "${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}"`,
      relatedId: report._id,
    })
  ));

  return report;
};

// 2. Báo cáo toàn bộ discussion
export const createDiscussionReport = async (discussionId, reporterId, reason) => {
  const discussion = await Discussion.findById(discussionId).select("course author");
  if (!discussion) throw new Error("Thảo luận không tồn tại");
  // Ràng buộc: không cho báo cáo thảo luận của mình
  if (discussion.author?.toString() === reporterId.toString()) {
    throw new Error("Bạn không thể báo cáo thảo luận của chính mình.");
  }

  const report = await Report.create({
    course: discussion.course,
    discussion: discussionId,
    reporter: reporterId,
    reportedUser: discussion.author, // người tạo thảo luận
    reason,
  });

  // const instructorId = await getInstructorFromDiscussion(discussionId);
  // if (instructorId) {
  //   await notificationService.createNotification({
  //     recipient: instructorId,
  //     sender: reporterId,
  //     type: "report",
  //     title: "Báo cáo thảo luận trong khóa học của bạn",
  //     message: `Học viên báo cáo chủ đề thảo luận: "${reason.substring(0, 80)}..."`,
  //     relatedId: report._id,
  //   });
  // }

  // Gửi thông báo cho tất cả admin
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(admins.map(admin =>
    notificationService.createNotification({
      recipient: admin._id,
      sender: reporterId,
      type: "report",
      title: "Báo cáo thảo luận mới", // hoặc "Báo cáo bình luận mới"
      message: `Có một báo cáo thảo luận: "${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}"`,
      relatedId: report._id,
    })
  ));

  return report;
};

// 3. Báo cáo reply cụ thể
export const createReplyReport = async (replyId, reporterId, reason) => {
  const discussion = await Discussion.findOne({ "replies._id": replyId });
  if (!discussion) throw new Error("Bình luận không tồn tại");
  const reply = discussion.replies.id(replyId);
  // Ràng buộc: không cho báo cáo reply của mình
  if (reply?.author?.toString() === reporterId.toString()) {
    throw new Error("Bạn không thể báo cáo bình luận của chính mình.");
  }

  const report = await Report.create({
    course: discussion.course,
    discussion: discussion._id,
    reply: replyId,
    reporter: reporterId,
    reportedUser: reply?.author, // người viết reply
    reason,
  });

  // const instructorId = await getInstructorFromDiscussion(discussion._id);
  // if (instructorId) {
  //   await notificationService.createNotification({
  //     recipient: instructorId,
  //     sender: reporterId,
  //     type: "report",
  //     title: "Báo cáo bình luận trong khóa học của bạn",
  //     message: `Học viên báo cáo một bình luận: "${reason.substring(0, 80)}..."`,
  //     relatedId: report._id,
  //   });
  // }

  // Gửi thông báo cho tất cả admin
  const admins = await User.find({ role: "admin" }).select("_id");
  for (const admin of admins) {
    await notificationService.createNotification({
      recipient: admin._id,
      sender: reporterId,
      type: "report",
      title: "Báo cáo bình luận mới",
      message: `Có một báo cáo bình luận: "${reason.substring(0, 100)}${reason.length > 100 ? '...' : ''}"`,
      relatedId: report._id,
    });
  }

  return report;
};

// 4. Lấy danh sách báo cáo, hỗ trợ lọc
export const getReports = async (filter, page = 1, limit = 20) => {
  return Report.find(filter)
    .populate("reporter", "name email")
    .populate("resolvedBy", "name email")
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
};

// 5. Xem chi tiết báo cáo, kèm lịch sử vi phạm
export const getReportDetail = async (id) => {
  const report = await Report.findById(id)
    .populate("reporter", "name email")
    .populate("resolvedBy", "name email")
    .populate("course", "title instructor slug")
    .populate("discussion", "content _id replies")
    .populate("reportedUser", "name email");
  if (!report) throw { statusCode: 404, message: "Không tìm thấy báo cáo" };
  let history = [];
  if (report.reportedUser) {
    history = await Report.find({
      reportedUser: report.reportedUser,
      status: "resolved",
      _id: { $ne: report._id }
    });
  }

  // Nếu là báo cáo reply, lấy nội dung reply từ discussion
  let replyObj = null;
  if (report.reply && report.discussion) {
    // Nếu discussion đã populate replies
    const discussion = report.discussion;
    // Nếu replies là undefined, cần truy vấn lại discussion
    let replies = discussion.replies;
    if (!replies) {
      const discussionDoc = await Discussion.findById(discussion._id);
      replies = discussionDoc?.replies;
    }
    if (replies) {
      replyObj = replies.id(report.reply);
    }
  }

  return { report, history, replyObj };
};

// 6. Xử lý báo cáo (resolved/rejected), ghi lịch sử & thực hiện biện pháp
export const resolveReport = async (id, status, adminNote, action, adminId) => {
  const report = await Report.findById(id);
  if (!report) throw { statusCode: 404, message: "Không tìm thấy báo cáo" };
  report.status = status;
  report.resolvedBy = adminId;
  report.resolvedAt = new Date();
  report.adminNote = adminNote;
  report.actions = report.actions || [];
  if (action) {
    report.actions.push({
      action,
      by: adminId,
      at: new Date(),
      note: adminNote
    });
    // Thực hiện các biện pháp xử lý
    if (action === "hide_course" && report.course) {
      await Course.findByIdAndUpdate(report.course, { status: "hidden" });
    }
    if (action === "ban_user" && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser, { isActive: false, banReason: adminNote });
    }
    if (action === "lock_comment") {
      if (report.discussion && !report.reply) {
        await Discussion.findByIdAndUpdate(report.discussion, { isHidden: true });
      }
      if (report.discussion && report.reply) {
        await Discussion.updateOne(
          { _id: report.discussion, "replies._id": report.reply },
          { $set: { "replies.$.isHidden": true } }
        );
      }
    }
    // ...thêm các biện pháp khác nếu cần
  }
  await report.save();

  // Gửi một thông báo tổng hợp cho người bị báo cáo
  if ((status === "resolved" || status === "reviewed") && report.reportedUser) {
    let reportType = "Khóa học";
    if (report.reply) reportType = "Bình luận";
    else if (report.discussion) reportType = "Thảo luận";

    // Xác định kết quả xử lý
    let result = "";
    if (action === "warn") result = "Kết quả: Bạn bị cảnh cáo.";
    else if (action === "ban_user") result = "Kết quả: Tài khoản của bạn đã bị khóa.";
    else if (action === "lock_comment") result = "Kết quả: Bình luận của bạn đã bị xóa.";
    else if (action === "hide_course") result = "Kết quả: Khóa học đã bị ẩn.";
    else result = "Kết quả: Báo cáo đã được xử lý.";

    await notificationService.createNotification({
      recipient: report.reportedUser,
      sender: adminId,
      type: "report",
      title: "Vi phạm",
      message: `Loại báo cáo: ${reportType}\nHành vi vi phạm: ${adminNote || report.reason}\n${result}`,
      relatedId: report._id,
    });
  }

  return report;
};

export const isSpamReporter = async (userId) => {
  const rejectedCount = await Report.countDocuments({
    reporter: userId,
    status: "rejected",
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });
  return rejectedCount >= 7;
};