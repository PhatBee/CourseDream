import nodemailer from 'nodemailer';

/**
 * Gửi email
 * @param {object} options - { to, subject, html }
 */
export const sendEmail = async (options) => {
  // 1. Tạo transporter (cấu hình Gmail)
  // Cảnh báo: Dùng Gmail cần "App Password" nếu bật 2FA
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    auth: {
      user: process.env.EMAIL_USER, // Thêm vào file .env
      pass: process.env.EMAIL_PASS, // Thêm vào file .env
    },
  });

  // 2. Định nghĩa các tùy chọn email
  const mailOptions = {
    from: 'DreamsCourse <no-reply@dreamslms.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  // 3. Gửi email
  await transporter.sendMail(mailOptions);
};