import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    discussion: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion" },
    reply: { type: mongoose.Schema.Types.ObjectId },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Người bị báo cáo
    reason: { type: String, required: true, trim: true, minlength: 10 },
    status: { type: String, enum: ["pending", "reviewed", "resolved", "rejected"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    adminNote: String,
    actions: [{
      action: {
        type: String,
        enum: ["warn", "hide_course", "ban_user", "lock_comment"], // chỉ cho phép các giá trị này
        required: true
      },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      at: { type: Date, default: Date.now },
      note: String
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);