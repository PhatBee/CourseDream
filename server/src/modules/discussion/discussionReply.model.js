import mongoose from "mongoose";

const DiscussionReplySchema = new mongoose.Schema(
  {
    discussionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
      index: true, // Đánh index để truy vấn replies theo discussion cực nhanh
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      required: true,
      minlength: 1,
    },
    upvoteCount: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isBestAnswer: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Tối ưu cho việc lấy danh sách reply phân trang theo thứ tự thời gian tạo
DiscussionReplySchema.index({ discussionId: 1, createdAt: 1 });

export default mongoose.model("DiscussionReply", DiscussionReplySchema);
