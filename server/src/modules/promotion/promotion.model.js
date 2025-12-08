// src/modules/promotion/promotion.model.js
import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ["percent", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    appliesTo: { type: String, enum: ["all", "category", "course"], required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Validation trước khi save
promotionSchema.pre("save", function (next) {
  if (this.startDate >= this.endDate) {
    return next(new Error("startDate phải trước endDate"));
  }
  if (this.appliesTo === "all") {
    this.category = null;
    this.course = null;
  }
  if (this.appliesTo === "category" && !this.category) {
    return next(new Error("category là bắt buộc khi appliesTo = category"));
  }
  if (this.appliesTo === "course" && !this.course) {
    return next(new Error("course là bắt buộc khi appliesTo = course"));
  }
  next();
});

export default mongoose.model("Promotion", promotionSchema);