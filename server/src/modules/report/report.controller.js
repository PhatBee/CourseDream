// src/controllers/report.controller.js
import { createReport, createDiscussionReport, createReplyReport, getReports, getReportDetail, resolveReport, isSpamReporter } from "../report/report.service.js";

export const postReport = async (req, res, next) => {
  try {
    const courseId = req.courseId;
    const reporter = req.user._id;
    const { reason } = req.body;

    // Kiểm tra spam
    if (await isSpamReporter(reporter)) {
      return res.status(403).json({
        success: false,
        message: "Bạn đã gửi quá nhiều báo cáo sai. Tính năng báo cáo bị hạn chế."
      });
    }

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

    if (await isSpamReporter(reporter)) {
      return res.status(403).json({
        success: false,
        message: "Bạn đã gửi quá nhiều báo cáo sai. Tính năng báo cáo bị hạn chế."
      });
    }

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

    if (await isSpamReporter(reporter)) {
      return res.status(403).json({
        success: false,
        message: "Bạn đã gửi quá nhiều báo cáo sai. Tính năng báo cáo bị hạn chế."
      });
    }

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

// Lấy danh sách báo cáo cho admin
export const adminGetReports = async (req, res, next) => {
  try {
    const { type, course, reporter, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    //if (type) filter.type = type;
    // Sửa filter type
    if (type === "course") {
      filter.discussion = { $exists: false };
      filter.reply = { $exists: false };
    } else if (type === "discussion") {
      filter.discussion = { $exists: true };
      filter.reply = { $exists: false };
    } else if (type === "reply") {
      filter.reply = { $exists: true };
    }
    if (course) filter.course = course;
    if (reporter) filter.reporter = reporter;
    if (status) filter.status = status;
    const reports = await getReports(filter, page, limit);
    //res.json({ success: true, data: reports });

    // Thêm trường type cho từng báo cáo
    const data = reports.map(r => ({
      ...r.toObject(),
      type: r.reply ? "reply" : r.discussion ? "discussion" : "course"
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// Xem chi tiết báo cáo
export const adminGetReportDetail = async (req, res, next) => {
  try {
    const { report, history, replyObj } = await getReportDetail(req.params.id);
    const data = {
      ...report.toObject(),
      type: report.reply ? "reply" : report.discussion ? "discussion" : "course",
      replyObj: replyObj ? {
        _id: replyObj._id,
        content: replyObj.content
      } : undefined
    };
    res.json({ success: true, data, history });
  } catch (err) { next(err); }
};

// Xử lý báo cáo
export const adminResolveReport = async (req, res, next) => {
  try {
    const { status, adminNote, action } = req.body;
    const report = await resolveReport(
      req.params.id,
      status,
      adminNote,
      action,
      req.user._id
    );
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};