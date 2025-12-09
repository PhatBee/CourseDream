import { body, validationResult } from "express-validator";
import Promotion from "../modules/promotion/promotion.model.js";


// VALIDATE CREATE PROMOTION (ADMIN)

export const validatePromotionCreate = [
  body("code")
    .isString()
    .notEmpty()
    .withMessage("Mã khuyến mãi là bắt buộc"),

  body("discountType")
    .isIn(["percent", "fixed"])
    .withMessage("Loại giảm không hợp lệ"),

  body("discountValue")
    .isNumeric()
    .custom((v) => v > 0)
    .withMessage("Giá trị giảm phải > 0"),

  body("appliesTo")
    .isIn(["all", "category", "course", "category+course"])
    .withMessage("appliesTo không hợp lệ"),

  body("startDate")
    .isISO8601()
    .toDate()
    .withMessage("startDate không hợp lệ"),

  body("endDate")
    .isISO8601()
    .toDate()
    .withMessage("endDate không hợp lệ"),

  body("categories")
    .optional()
    .isArray()
    .withMessage("categories phải là mảng"),

  body("courses")
    .optional()
    .isArray()
    .withMessage("courses phải là mảng"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];

//  VALIDATE UPDATE PROMOTION (ADMIN)
//  → CHO UPDATE PARTIAL (không bắt buộc đủ fields)

export const validatePromotionUpdate = [
  body("code")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Mã khuyến mãi không hợp lệ"),

  body("discountType")
    .optional()
    .isIn(["percent", "fixed"])
    .withMessage("Loại giảm không hợp lệ"),

  body("discountValue")
    .optional()
    .isNumeric()
    .custom((v) => v > 0)
    .withMessage("Giá trị giảm phải > 0"),

  body("appliesTo")
    .optional()
    .isIn(["all", "category", "course", "category+course"])
    .withMessage("appliesTo không hợp lệ"),

  body("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("startDate không hợp lệ"),

  body("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("endDate không hợp lệ"),

  body("categories")
    .optional()
    .isArray()
    .withMessage("categories phải là mảng"),

  body("courses")
    .optional()
    .isArray()
    .withMessage("courses phải là mảng"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  },
];


// CHECK CODE EXISTS (ONLY FOR CREATE)
export const checkCodeExists = async (req, res, next) => {
  const { code } = req.body;
  const existing = await Promotion.findOne({ code: code.toUpperCase() });

  if (existing) {
    return res.status(400).json({ message: "Mã khuyến mãi đã tồn tại" });
  }

  next();
};

//VALIDATE PROMOTION WHEN USER APPLY CODE
export const validateAndLoadPromotion = [
  body("code").isString().notEmpty().withMessage("Vui lòng nhập mã khuyến mãi"),
  body("courseId")
    .isMongoId()
    .withMessage("courseId không hợp lệ"),
  body("price")
    .isNumeric()
    .custom((p) => p >= 0)
    .withMessage("Giá phải >= 0"),

  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const promotion = await Promotion.findOne({
        code: req.body.code.toUpperCase(),
        isActive: true,
      });

      if (!promotion) {
        return res.status(400).json({
          message: "Mã khuyến mãi không tồn tại hoặc đã bị tắt",
        });
      }

      req.promotion = promotion;
      next();
    } catch (err) {
      return res.status(500).json({ message: "Lỗi server khi kiểm tra mã" });
    }
  },
];