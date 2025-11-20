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

// Quy tắc validation cho cập nhật profile
export const validateUpdateProfile = [
    // 1. Kiểm tra 'name' - bắt buộc
    body('name')
        .trim()
        .notEmpty().withMessage('Họ và tên là bắt buộc')
        .isLength({ min: 2, max: 50 }).withMessage('Họ và tên phải từ 2-50 ký tự')
        .matches(/^[\p{L}\s]+$/u).withMessage('Họ và tên chỉ được chứa chữ cái và khoảng trắng')
        .customSanitizer(value => value.replace(/\s+/g, ' ').trim()), // Loại bỏ khoảng trắng thừa

    // 2. Kiểm tra 'phone' - không bắt buộc nhưng nếu có thì phải hợp lệ
    body('phone')
        .optional({ checkFalsy: true }) // Cho phép rỗng
        .trim()
        .matches(/^(0|\+84)[0-9]{9,10}$/).withMessage('Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx')
        .customSanitizer(value => value.trim()),

    // 3. Kiểm tra 'bio' - không bắt buộc
    body('bio')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 500 }).withMessage('Bio không được vượt quá 500 ký tự')
        .customSanitizer(value => value.trim()),

    // 4. Áp dụng middleware xử lý lỗi
    handleValidationErrors
];
