// src/controllers/report.controller.js
import { createReport, createDiscussionReport, createReplyReport } from "../report/report.service.js";

export const postReport = async (req, res, next) => {
  try {
    const courseId = req.courseId; // từ middleware checkEnrollment
    const reporter = req.user._id;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Lý do báo cáo phải từ 10 ký tự trở lên"
      });
    }

    const report = await createReport(courseId, reporter, reason.trim());

    res.status(201).json({
      success: true,
      message: "Báo cáo đã được gửi thành công. Cảm ơn phản hồi của bạn!",
      data: report
    });
  } catch (err) {
    next(err);
  }
};

export const postDiscussionReport = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const reporter = req.user._id;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Lý do phải từ 10 ký tự" });
    }

    const report = await createDiscussionReport(discussionId, reporter, reason.trim());

    res.status(201).json({
      success: true,
      message: "Báo cáo thảo luận đã được gửi!",
      data: report
    });
  } catch (err) { next(err); }
};

export const postReplyReport = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const reporter = req.user._id;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Lý do phải từ 10 ký tự" });
    }

    const report = await createReplyReport(replyId, reporter, reason.trim());

    res.status(201).json({
      success: true,
      message: "Báo cáo bình luận đã được gửi!",
      data: report
    });
  } catch (err) { next(err); }
};