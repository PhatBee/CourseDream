// server/src/modules/notification/notification.model.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: [
        // CHỈ LƯU NHỮNG GÌ SẼ HIỂN THỊ CHUÔNG:
        "reminder_learning",
        "reply",
        "system",
        "report",
        "warning",
        "reward_voucher",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    metadata: {
      courseId: mongoose.Schema.Types.ObjectId,
      courseSlug: String,
      lessonId: mongoose.Schema.Types.ObjectId,
      discussionId: mongoose.Schema.Types.ObjectId,
      replyId: mongoose.Schema.Types.ObjectId,
      orderId: mongoose.Schema.Types.ObjectId,
      reportId: mongoose.Schema.Types.ObjectId,
      url: String,
      isDeleted: { type: Boolean, default: false }, // Dùng để đánh dấu thông báo này đã bị xóa (ẩn) nhưng chưa đến lúc xóa hẳn khỏi DB

      // BỔ SUNG THÊM 3 TRƯỜNG NÀY ĐỂ RENDER POPUP ĐẸP HƠN
      reportReasonLabel: String,
      adminNote: String,
      originalContent: String,

      // Bổ sung cho reward voucher
      voucherCode: String,
      discountValue: Number,
      discountType: String,
      expiredAt: Date,
      sourceType: String,
      courseTitle: String,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
export default mongoose.model("Notification", NotificationSchema);
