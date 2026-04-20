// src/controllers/report.controller.js
import {
  createPolymorphicReport,
  getReports,
  getReportDetail,
  resolveReport,
  isSpamReporter,
} from "../report/report.service.js";

export const postReport = async (req, res, next) => {
  try {
    const courseId = req.courseId;
    const reporter = req.user._id;
    const { reason, description } = req.body;

    // Kiểm tra spam
    if (await isSpamReporter(reporter)) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn đã gửi quá nhiều báo cáo sai. Tính năng báo cáo bị hạn chế.",
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Lý do báo cáo không được để trống",
      });
    }

    const report = await createPolymorphicReport(
      reporter,
      courseId,
      "course",
      reason,
      description,
    );

    res.status(201).json({
      success: true,
      message: "Báo cáo đã được gửi thành công. Cảm ơn phản hồi của bạn!",
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

export const postDiscussionReport = async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const reporter = req.user._id;
    const { reason, description } = req.body;

    if (await isSpamReporter(reporter)) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn đã gửi quá nhiều báo cáo sai. Tính năng báo cáo bị hạn chế.",
      });
    }

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Lý do báo cáo không được để trống" });
    }

    const report = await createPolymorphicReport(
      reporter,
      discussionId,
      "discussion",
      reason,
      description,
    );

    res.status(201).json({
      success: true,
      message: "Báo cáo thảo luận đã được gửi!",
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

export const postReplyReport = async (req, res, next) => {
  try {
    const { replyId } = req.params;
    const reporter = req.user._id;
    const { reason, description } = req.body;

    if (await isSpamReporter(reporter)) {
      return res.status(403).json({
        success: false,
        message:
          "Bạn đã gửi quá nhiều báo cáo sai. Tính năng báo cáo bị hạn chế.",
      });
    }

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Lý do báo cáo không được để trống" });
    }

    const report = await createPolymorphicReport(
      reporter,
      replyId,
      "reply",
      reason,
      description,
    );

    res.status(201).json({
      success: true,
      message: "Báo cáo bình luận đã được gửi!",
      data: report,
    });
  } catch (err) {
    next(err);
  }
};

// Lấy danh sách báo cáo cho admin
export const adminGetReports = async (req, res, next) => {
  try {
    const { type, course, reporter, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.targetType = type;
    if (course) filter.targetId = course;
    if (reporter) filter.reporter = reporter;
    if (status) filter.status = status;
    const reports = await getReports(filter, page, limit);

    // Thêm trường type để tương thích UI admin
    const data = reports.map((r) => ({
      ...r,
      type: r.targetType,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// Xem chi tiết báo cáo
export const adminGetReportDetail = async (req, res, next) => {
  try {
    const { report, history, replyObj } = await getReportDetail(req.params.id);
    const data = {
      ...report,
      type: report.targetType,
      replyObj: replyObj
        ? {
            _id: replyObj._id,
            content: replyObj.content,
          }
        : undefined,
    };
    res.json({ success: true, data, history });
  } catch (err) {
    next(err);
  }
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
      req.user._id,
    );
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
