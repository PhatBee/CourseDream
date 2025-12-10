// src/modules/promotion/promotion.model.js
import mongoose from "mongoose";
import { promotionPreSave } from "./promotion.validation.js";

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["all", "category", "course", "category+course"], required: true },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }], // mảng category
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],     // mảng course
    minPrice: { type: Number, default: 0, min: 0 },
    maxUsage: { type: Number, default: 0 }, // 0 = không giới hạn
    maxUsagePerUser: { type: Number, default: 0 }, // 0 = không giới hạn
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalUsed: { type: Number, default: 0 },
    usersUsed: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        count: { type: Number, default: 0 },
      },
    ],
    isActive: { type: Boolean, default: true }, // trạng thái hoạt động
  },
  { timestamps: true }
);

promotionSchema.pre("save", promotionPreSave);

export default mongoose.model("Promotion", promotionSchema);