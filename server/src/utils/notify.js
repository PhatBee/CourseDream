// src/utils/notify.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailNotification = async ({ to, name, title, message }) => {
  try {
    await transporter.sendMail({
      from: '"LMS Platform" <no-reply@lms.com>',
      to,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Xin chào ${name || "bạn"},</h2>
          <h3>${title}</h3>
          <p>${message}</p>
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