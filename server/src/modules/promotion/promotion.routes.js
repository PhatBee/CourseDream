import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.middleware.js";
import {
  validatePromotionCreate,
  validatePromotionUpdate,
  checkCodeExists,
  validateAndLoadPromotion,
} from "../../middlewares/promotion.middleware.js";
import {
  createPromotionCtrl,
  updatePromotionCtrl,
  deletePromotionCtrl,
  getAllPromotionsCtrl,
  previewPromotionCtrl,
  commitPromotionCtrl,
  getAvailablePromotionsCtrl,
} from "./promotion.controller.js";

const router = express.Router();

// === ADMIN ===
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  validatePromotionCreate,
  checkCodeExists,
  createPromotionCtrl
);
router.put("/:id", verifyToken, checkRole("admin"), validatePromotionUpdate, updatePromotionCtrl);
router.delete("/:id", verifyToken, checkRole("admin"), deletePromotionCtrl);
router.get("/", verifyToken, checkRole("admin"), getAllPromotionsCtrl);

// === USER ===
router.post("/preview", verifyToken, validateAndLoadPromotion, previewPromotionCtrl); // Thay apply thành preview
router.post("/commit", verifyToken, commitPromotionCtrl); // Route mới cho commit
router.get("/available", verifyToken, getAvailablePromotionsCtrl);

export default router;