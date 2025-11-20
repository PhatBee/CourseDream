import { body, validationResult } from 'express-validator';

// Middleware xử lý lỗi validation chung
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Lấy lỗi đầu tiên và gửi về client
    const firstError = errors.array()[0].msg;
    const err = new Error(firstError);
    err.status = 400; // 400 Bad Request
    return next(err);
  }
  next();
};

// Quy tắc validation cho đăng ký
export const validateRegister = [
  // 1. Kiểm tra 'name'
  body('name')
    .trim()
    .notEmpty().withMessage('Họ và tên là bắt buộc')
    .isLength({ min: 2, max: 50 }).withMessage('Họ và tên phải từ 2-50 ký tự')
    .matches(/^[\p{L}\s]+$/u).withMessage('Họ và tên chỉ được chứa chữ cái và khoảng trắng')
    .customSanitizer(value => value.replace(/\s+/g, ' ').trim()), // Loại bỏ khoảng trắng thừa

  // 2. Kiểm tra 'email'
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),

  // 3. Kiểm tra 'password'
  body('password')
    .isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ cái, 1 chữ số, và 1 ký tự đặc biệt'),

  // 4. Áp dụng middleware xử lý lỗi
  handleValidationErrors
];

// Quy tắc validation reset password
export const validateResetPassword = [
  // Kiểm tra 'password'
  body('password')
    .isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ cái, 1 chữ số, và 1 ký tự đặc biệt'),

  // Áp dụng middleware xử lý lỗi
  handleValidationErrors
]