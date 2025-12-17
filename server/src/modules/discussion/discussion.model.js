// src/models/discussion.model.js
import mongoose from "mongoose";

const DiscussionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, minlength: 1 },
    isHidden: { type: Boolean, default: false }, // Chủ đề thảo luận bị ẩn
    replies: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      content: { type: String, required: true, trim: true, minlength: 1 },
      createdAt: { type: Date, default: Date.now },
      isHidden: { type: Boolean, default: false }  // Bình luận bị ẩn
    }]
  },
  { timestamps: true }
);

DiscussionSchema.index({ course: 1, createdAt: -1 });

export default mongoose.model("Discussion", DiscussionSchema);