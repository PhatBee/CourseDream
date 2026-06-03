// src/utils/notify.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailNotification = async ({ to, name, title, message, metadata }) => {
  try {
    let metadataHtml = "";
    if (metadata) {
      if (metadata.reportReasonLabel) {
        metadataHtml += `<p><strong>Lý do:</strong> ${metadata.reportReasonLabel}</p>`;
      }
      if (metadata.originalContent) {
        metadataHtml += `<p><strong>Nội dung:</strong> <em>${metadata.originalContent}</em></p>`;
      }
      if (metadata.adminNote) {
        metadataHtml += `<p><strong>Ghi chú từ quản trị viên:</strong> <span style="color: red;">${metadata.adminNote}</span></p>`;
      }
      if (metadata.courseTitle) {
        metadataHtml += `<p><strong>Khóa học:</strong> ${metadata.courseTitle}</p>`;
      }
    }

    await transporter.sendMail({
      from: '"LMS Platform" <no-reply@lms.com>',
      to,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Xin chào ${name || "bạn"},</h2>
          <h3>${title}</h3>
          <p>${message}</p>
          ${metadataHtml ? `<div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">${metadataHtml}</div>` : ""}
          <hr>
          <p><a href="${process.env.CLIENT_URL}/notifications" style="color: #007bff;">Xem tất cả thông báo</a></p>
          <small>Đây là email tự động, vui lòng không trả lời.</small>
        </div>
      `,
    });
  } catch (err) {
    console.log("Gửi email thông báo thất bại:", err.message);
  }
};