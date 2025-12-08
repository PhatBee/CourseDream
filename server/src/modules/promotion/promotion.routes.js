// src/modules/promotion/promotion.routes.js
import express from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.middleware.js";
import {
  validatePromotionInput,
  checkCodeExists,
  validateAndLoadPromotion,
} from "../../middlewares/promotion.middleware.js";

import {
  createPromotionCtrl,
  updatePromotionCtrl,
  deletePromotionCtrl,
  getAllPromotionsCtrl,
  applyPromotionCtrl,
} from "./promotion.controller.js";

const router = express.Router();

// === ADMIN ===
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  validatePromotionInput,
  checkCodeExists,
  createPromotionCtrl
);

router.put("/:id", verifyToken, checkRole("admin"), validatePromotionInput, updatePromotionCtrl);
router.delete("/:id", verifyToken, checkRole("admin"), deletePromotionCtrl);
router.get("/", verifyToken, checkRole("admin"), getAllPromotionsCtrl);

// === USER ===
router.post("/apply", verifyToken, validateAndLoadPromotion, applyPromotionCtrl);

export default router;