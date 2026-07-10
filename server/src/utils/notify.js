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
      if (metadata.voucherCode) {
        metadataHtml += `
          <div style="text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #ffc107; background-color: #fffdf5; border-radius: 10px;">
            <p style="font-size: 16px; font-weight: bold; color: #ff9800; margin: 0 0 10px 0;">🎁 MÃ ƯU ĐÃI ĐẶC QUYỀN HOÀN THÀNH KHÓA HỌC 🎁</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #e11d48; margin: 10px 0; background: #fff; padding: 10px 15px; border-radius: 5px; border: 1px solid #ffeeba; display: inline-block;">
              ${metadata.voucherCode}
            </div>
            <p style="font-size: 14px; margin: 10px 0 0 0; color: #666; line-height: 1.5;">
              Mức giảm: <strong>${metadata.discountValue}%</strong> cho đơn hàng tiếp theo<br/>
              Hạn dùng đến: <strong>${new Date(metadata.expiredAt).toLocaleDateString('vi-VN')}</strong><br/>
              <span style="font-size: 12px; color: #888;">(Voucher chỉ áp dụng cho tài khoản của bạn và có giá trị trong vòng 7 ngày)</span>
            </p>
          </div>
        `;
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