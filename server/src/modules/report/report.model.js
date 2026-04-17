import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Generic Target (Khắc phục việc fix cứng course, discussion, reply)
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetType: {
      type: String,
      enum: ["course", "discussion", "reply"],
      required: true,
    },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Người tạo nội dung bị report

    // Danh mục lỗi + Mô tả chi tiết
    reason: {
      type: String,
      enum: [
        "SPAM",
        "INAPPROPRIATE_CONTENT",
        "COPYRIGHT_VIOLATION",
        "FRAUD",
        "HARASSMENT",
        "OTHER",
      ],
      required: true,
    },
    description: { type: String, trim: true }, // Chi tiết user nhập thêm

    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "rejected"],
      default: "pending",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "low" }, // Thêm priority

    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    adminNote: String,
    actions: [
      {
        /* ... (giữ nguyên của bạn) ... */
      },
    ],
  },
  { timestamps: true },
);

// Ràng buộc quan trọng: 1 người chỉ được mở 1 report pending cho cùng 1 đối tượng
ReportSchema.index(
  { reporter: 1, targetId: 1, targetType: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export default mongoose.model("Report", ReportSchema);
