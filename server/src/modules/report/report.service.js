// src/services/report.service.js
import Report from "../report/report.model.js";
import Course from "../course/course.model.js";
import Discussion from "../discussion/discussion.model.js";
import User from "../auth/auth.model.js";
import notificationService from "../notification/notification.service.js";
import mongoose from "mongoose";
import { getIO } from "../socket/index.js";

// Bỏ hàm lấy instructor riêng biệt, ta xử lý bên trong createPolymorphicReport
// Hàm chung xử lý mọi trường hợp báo cáo với Anti-spam & Polymorphic structure
export const createPolymorphicReport = async (
  reporterId,
  targetId,
  targetType,
  reason,
  description,
) => {
  // 1. Kiểm tra spam (Rate Limit theo giờ) -> Ví dụ tối đa 5 report/giờ
  const reportCount = await Report.countDocuments({
    reporter: reporterId,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (reportCount >= 5) {
    throw new Error("Bạn thao tác quá nhanh. Vui lòng thử lại sau.");
  }

  let reportedUserId = null;
  let summaryContext = "";

  // 2. Tìm người bị báo cáo & validate logic theo targetType
  if (targetType === "course") {
    const course = await Course.findById(targetId);
    if (!course) throw new Error("Khóa học không tồn tại");
    if (course.instructor.toString() === reporterId.toString()) {
      throw new Error("Bạn không thể báo cáo khóa học của chính mình.");
    }
    reportedUserId = course.instructor;
    summaryContext = `Khóa học: ${course.title}`;
  } else if (targetType === "discussion") {
    const discussion = await Discussion.findById(targetId);
    if (!discussion) throw new Error("Thảo luận không tồn tại");
    if (discussion.author?.toString() === reporterId.toString()) {
      throw new Error("Bạn không thể báo cáo thảo luận của chính mình.");
    }
    reportedUserId = discussion.author;
    summaryContext = `Thảo luận: ${discussion.title}`;
  } else if (targetType === "reply") {
    const discussion = await Discussion.findOne({ "replies._id": targetId });
    if (!discussion) throw new Error("Bình luận không tồn tại");
    const reply = discussion.replies.id(targetId);
    if (reply?.author?.toString() === reporterId.toString()) {
      throw new Error("Bạn không thể báo cáo bình luận của chính mình.");
    }
    reportedUserId = reply.author;
    summaryContext = `Bình luận: ${reply.content.substring(0, 50)}...`;
  } else {
    throw new Error("Loại đối tượng báo cáo không hợp lệ.");
  }

  // 3. Kiểm tra xem report này có bị trùng hay không (Duplicate check)
  const existingReport = await Report.findOne({
    reporter: reporterId,
    targetId,
    targetType,
    status: "pending",
  });
  if (existingReport) {
    throw new Error("Bạn đã báo cáo nội dung này rồi, vui lòng chờ xử lý.");
  }

  // 4. Auto Priority (Nếu bị report nhiều bởi các người khác nhau => Cảnh báo High)
  const sameTargetReports = await Report.countDocuments({
    targetId,
    status: "pending",
  });
  let priority = "low";
  if (sameTargetReports >= 2) priority = "medium";
  if (sameTargetReports >= 5) priority = "high";

  // 5. Tạo Report
  const report = await Report.create({
    reporter: reporterId,
    targetId,
    targetType,
    reportedUser: reportedUserId,
    reason,
    description,
    priority,
  });

  // 6. Thông báo cho Admin (tạm gửi cho Admin, có thể log lại tuỳ hệ thống)
  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        recipient: admin._id,
        sender: reporterId,
        type: "report",
        title: `Báo cáo mới [Priority: ${priority.toUpperCase()}]`,
        message: `Loại: ${targetType.toUpperCase()} - Reason: ${reason} \n${summaryContext.substring(0, 50)}`,
        relatedId: report._id,
      }),
    ),
  );

  // Gửi thông báo cho người báo cáo
  const io = getIO();
  io.to(reporterId).emit("report.created", report);

  return report;
};

// 4. Lấy danh sách báo cáo, hỗ trợ lọc
export const getReports = async (filter, page = 1, limit = 20) => {
  const reports = await Report.find(filter)
    .populate("reporter", "name email")
    .populate("resolvedBy", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  // Mapping thủ công Course Titles cho UI Admin
  const Course = mongoose.model("Course");
  const Discussion = mongoose.model("Discussion");

  for (let r of reports) {
    if (r.targetType === "course") {
      r.course = await Course.findById(r.targetId, "title").lean();
    } else if (r.targetType === "discussion") {
      const d = await Discussion.findById(r.targetId, "course title")
        .populate("course", "title")
        .lean();
      if (d) r.course = d.course;
    } else if (r.targetType === "reply") {
      const d = await Discussion.findOne(
        { "replies._id": r.targetId },
        "course",
      )
        .populate("course", "title")
        .lean();
      if (d) r.course = d.course;
    }
  }

  return reports;
};

// 5. Xem chi tiết báo cáo, kèm lịch sử vi phạm
export const getReportDetail = async (id) => {
  const reportDoc = await Report.findById(id)
    .populate("reporter", "name email")
    .populate("resolvedBy", "name email")
    .populate("reportedUser", "name email");

  if (!reportDoc) throw { statusCode: 404, message: "Không tìm thấy báo cáo" };
  const report = reportDoc.toObject();

  const Course = mongoose.model("Course");
  const Discussion = mongoose.model("Discussion");

  // Nạp dữ liệu giả lập cho Frontend UI đã được thiết kế
  if (report.targetType === "course") {
    report.course = await Course.findById(
      report.targetId,
      "title instructor slug",
    ).lean();
  } else if (report.targetType === "discussion") {
    report.discussion = await Discussion.findById(
      report.targetId,
      "content _id replies course lectureId", // <-- Lấy thêm lectureId
    )
      .populate("course", "title instructor slug")
      .lean();
    report.course = report.discussion?.course;
  } else if (report.targetType === "reply") {
    report.discussion = await Discussion.findOne(
      { "replies._id": report.targetId },
      "content _id replies course lectureId",
    )
      .populate("course", "title instructor slug")
      .lean();
    report.course = report.discussion?.course;
  }

  let history = [];
  if (report.reportedUser) {
    history = await Report.find({
      reportedUser: report.reportedUser._id || report.reportedUser,
      status: "resolved",
      _id: { $ne: report._id },
    }).lean();
  }

  let replyObj = null;
  if (report.targetType === "reply" && report.discussion) {
    const replies = report.discussion.replies || [];
    // Format to string due to _id is ObjectId
    replyObj = replies.find(
      (r) => r._id.toString() === report.targetId.toString(),
    );
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

  const Course = mongoose.model("Course");
  const Discussion = mongoose.model("Discussion");
  const User = mongoose.model("User");

  if (action) {
    report.actions.push({
      action,
      by: adminId,
      at: new Date(),
      note: adminNote,
    });

    // Thực hiện các biện pháp xử lý
    // 3.1 Ẩn Khoá Hoc
    if (action === "hide_course") {
      let courseId = null;
      if (report.targetType === "course") courseId = report.targetId;
      else if (report.targetType === "discussion") {
        const d = await Discussion.findById(report.targetId, "course");
        courseId = d?.course;
      } else if (report.targetType === "reply") {
        const d = await Discussion.findOne(
          { "replies._id": report.targetId },
          "course",
        );
        courseId = d?.course;
      }
      if (courseId)
        await Course.findByIdAndUpdate(courseId, { status: "hidden" });
    }

    // 3.2 Khoá TK Người dùng và gửi tính hiệu ép Client Logout qua Socket
    if (action === "ban_user" && report.reportedUser) {
      await User.findByIdAndUpdate(report.reportedUser, {
        isActive: false,
        banReason: adminNote,
      });

      // Phát sự kiện 'account_banned' đến mọi session đang mở của user này
      const io = getIO();
      if (io) {
        io.to(`user_${report.reportedUser}`).emit("account_banned", {
          reason:
            adminNote ||
            "Tài khoản của bạn đã bị khóa do vi phạm nguyên tắc cộng đồng.",
        });
      }
    }

    // 3.3 Khoá bình luận/ thảo luận
    if (action === "lock_comment") {
      if (report.targetType === "discussion") {
        await Discussion.findByIdAndUpdate(report.targetId, {
          isHidden: true,
        });
      }
      if (report.targetType === "reply") {
        await Discussion.updateOne(
          { "replies._id": report.targetId },
          { $set: { "replies.$.isHidden": true } },
        );
      }
    }
  }
  await report.save(); // Chỗ này là kết thúc ghi lịch sử xử lý cũ của bạn

  // LẤY DỮ LIỆU ĐỂ ĐIỀU HƯỚNG VÀ IN VÀO THÔNG BÁO
  let courseSlug = null;
  let lessonId = null;
  let discussionId = null;
  let replyId = null;
  let originalContent = "Nội dung vi phạm"; // Khai báo

  if (report.targetType === "course") {
    const c = await Course.findById(report.targetId).select("slug title");
    if (c) {
      courseSlug = c.slug;
      originalContent = `Khóa học: ${c.title}`;
    }
  } else if (report.targetType === "discussion") {
    const d = await Discussion.findById(report.targetId).populate(
      "course",
      "slug",
    );
    if (d) {
      courseSlug = d.course?.slug;
      lessonId = d.lectureId;
      discussionId = d._id;
      // HIỂN THỊ ĐẦY ĐỦ TIÊU ĐỀ + NỘI DUNG THẢO LUẬN BỊ XÓA
      originalContent = `Tiêu đề: ${d.title}\nChi tiết: ${d.content}`;
    }
  } else if (report.targetType === "reply") {
    const d = await Discussion.findOne({
      "replies._id": report.targetId,
    }).populate("course", "slug");
    if (d) {
      courseSlug = d.course?.slug;
      lessonId = d.lectureId;
      discussionId = d._id;
      replyId = report.targetId;
      const rep = d.replies.id(report.targetId);
      // HIỂN THỊ ĐẦY ĐỦ BÌNH LUẬN (BỎ HÀM .substring CŨ ĐI)
      if (rep) originalContent = `${rep.content}`;
    }
  }

  // Gửi một thông báo tổng hợp cho người bị báo cáo
  if ((status === "resolved" || status === "reviewed") && report.reportedUser) {
    const isDeletedAction =
      action === "hide_course" || action === "lock_comment";

    // 1. ÁNH XẠ LÝ DO (REASON) RA LABEL TIẾNG VIỆT
    const REASON_MAP = {
      INAPPROPRIATE_CONTENT: "Nội dung không phù hợp / Vi phạm chính sách",
      COPYRIGHT_VIOLATION: "Vi phạm bản quyền",
      FRAUD: "Lừa đảo / Sai sự thật",
      HARASSMENT: "Hành vi không phù hợp / Quấy rối",
      SPAM: "Spam hoặc quảng cáo",
      OTHER: "Khác",
    };
    const reportReasonLabel = REASON_MAP[report.reason] || report.reason;

    // 2. KHÔNG CỘNG STRING NỮA, LƯU VÀO METADATA ĐỂ TÁCH BIỆT BÊN FRONTEND
    await notificationService.createNotification({
      recipient: report.reportedUser,
      sender: adminId,
      type: "warning",
      title: isDeletedAction
        ? `BÁO CÁO VI PHẠM: NỘI DUNG BỊ ${action === "hide_course" ? "ẨN" : "XÓA"}`
        : "CẢNH BÁO VI PHẠM TỪ ADMIN",
      message: isDeletedAction
        ? "Nội dung của bạn đã bị gỡ bỏ do vi phạm tiêu chuẩn cộng đồng của hệ thống."
        : "Bạn có một nhắc nhở từ quản trị viên về hành vi của mình.",
      metadata: {
        isDeleted: isDeletedAction,
        courseSlug,
        lessonId,
        discussionId,
        replyId,
        reportReasonLabel: reportReasonLabel, // Gắn nhãn lỗi
        adminNote: adminNote || "", // Lời nhắn admin riêng biệt
        originalContent: originalContent, // Nội dung đầy đủ
      },
    });
  }

  return report;
};

export const isSpamReporter = async (userId) => {
  const rejectedCount = await Report.countDocuments({
    reporter: userId,
    status: "rejected",
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });
  return rejectedCount >= 7;
};
