// src/middlewares/promotion.middleware.js
import { body, validationResult } from "express-validator";
import Promotion from "../modules/promotion/promotion.model.js";

// 1. Validate khi admin tạo/sửa mã
export const validatePromotionInput = [
  body("code").isString().notEmpty().withMessage("Mã khuyến mãi là bắt buộc"),
  body("discountType").isIn(["percent", "fixed"]).withMessage("Loại giảm không hợp lệ"),
  body("discountValue").isNumeric().custom((v) => v > 0).withMessage("Giá trị giảm phải > 0"),
  body("appliesTo").isIn(["all", "category", "course"]).withMessage("appliesTo không hợp lệ"),
  body("startDate").isISO8601().toDate().withMessage("startDate không hợp lệ"),
  body("endDate").isISO8601().toDate().withMessage("endDate không hợp lệ"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];

// 2. Kiểm tra code đã tồn tại chưa (khi tạo)
export const checkCodeExists = async (req, res, next) => {
  const { code } = req.body;
  const existing = await Promotion.findOne({ code: code.toUpperCase() });
  if (existing) {
    return res.status(400).json({ message: "Mã khuyến mãi đã tồn tại" });
  }
  next();
};

// 3. Validate và load mã khuyến mãi khi user áp dụng
export const validateAndLoadPromotion = [
  body("code").isString().notEmpty().withMessage("Vui lòng nhập mã khuyến mãi"),
  body("courseId").isMongoId().withMessage("courseId không hợp lệ"),
  body("price").isNumeric().custom((p) => p >= 0).withMessage("Giá phải >= 0"),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { code } = req.body;
      const promotion = await Promotion.findOne({
        code: code.toUpperCase(),
        isActive: true,
      });

      if (!promotion) {
        return res.status(400).json({ message: "Mã khuyến mãi không tồn tại hoặc đã bị tắt" });
      }

      // Gắn sẵn promotion vào req → service không cần query lại
      req.promotion = promotion;
      next();
    } catch (err) {
      return res.status(500).json({ message: "Lỗi server khi kiểm tra mã" });
    }
  },
];