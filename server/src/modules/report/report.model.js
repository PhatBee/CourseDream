import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    discussion: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion" }, // mới
    reply: { type: mongoose.Schema.Types.ObjectId }, // mới
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, minlength: 10 },
    status: { type: String, enum: ["pending", "reviewed", "resolved"], default: "pending" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
    adminNote: String
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);