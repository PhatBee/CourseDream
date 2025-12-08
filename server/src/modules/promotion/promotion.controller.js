// src/modules/promotion/promotion.controller.js
import {
  applyPromotionLogic,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAllPromotions,
} from "./promotion.service.js";

export const createPromotionCtrl = async (req, res) => {
  try {
    const promotion = await createPromotion(req.body);
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updatePromotionCtrl = async (req, res) => {
  try {
    const promotion = await updatePromotion(req.params.id, req.body);
    res.json(promotion);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deletePromotionCtrl = async (req, res) => {
  try {
    const result = await deletePromotion(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAllPromotionsCtrl = async (req, res) => {
  try {
    const promotions = await getAllPromotions();
    res.json(promotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Route /apply – giờ chỉ còn 10 dòng!
export const applyPromotionCtrl = async (req, res) => {
  try {
    const { courseId, price } = req.body;
    const userId = req.user._id;
    const promotion = req.promotion; // Đã được middleware gắn sẵn

    const result = await applyPromotionLogic(promotion, courseId, price, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};