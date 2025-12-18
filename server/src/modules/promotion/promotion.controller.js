import {
  previewPromotion,
  commitPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getAllPromotions,
} from "./promotion.service.js";
import Promotion from "./promotion.model.js";
import Course from "../course/course.model.js";

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

// Preview promotion (thay thế apply cũ)
export const previewPromotionCtrl = async (req, res) => {
  try {
    const { courseId } = req.body; // Loại bỏ price vì lấy từ DB
    const userId = req.user._id;
    const promotion = req.promotion; // Từ middleware
    const result = await previewPromotion(promotion, courseId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Commit sau payment success
export const commitPromotionCtrl = async (req, res) => {
  try {
    const { promotionId } = req.body;
    const userId = req.user._id;
    const result = await commitPromotion(promotionId, userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getAvailablePromotionsCtrl = async (req, res) => {
  try {
    const userId = req.user._id;
    let courseIds = req.query.courseIds;
    if (typeof courseIds === "string") courseIds = courseIds.split(",");
    const now = new Date();

    let promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [{ maxUsage: 0 }, { $expr: { $lt: ["$totalUsed", "$maxUsage"] } }],
    }).lean();

    if (courseIds && courseIds.length > 0) {
      const courses = await Course.find({ _id: { $in: courseIds } }).select("_id categories");
      promotions = promotions.filter((promo) => {
        if (promo.appliesTo === "all") return true;
        if (promo.appliesTo === "course")
          return promo.courses.some((id) => courseIds.includes(id.toString()));
        if (promo.appliesTo === "category")
          return courses.some((c) =>
            c.categories.some((cat) => promo.categories.map(String).includes(cat.toString()))
          );
        if (promo.appliesTo === "category+course")
          return (
            promo.courses.some((id) => courseIds.includes(id.toString())) ||
            courses.some((c) =>
              c.categories.some((cat) => promo.categories.map(String).includes(cat.toString()))
            )
          );
        return false;
      });
    }

    res.json(promotions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};