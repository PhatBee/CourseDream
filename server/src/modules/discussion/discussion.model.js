import mongoose from "mongoose";

const DiscussionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true, minlength: 5 },
    content: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    bestAnswerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscussionReply",
    },
    answerCount: { type: Number, default: 0 },
    upvoteCount: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isHidden: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

DiscussionSchema.index({ course: 1, status: 1, createdAt: -1 });
DiscussionSchema.index({ course: 1, upvoteCount: -1 });
DiscussionSchema.index({ title: "text", content: "text" });

export default mongoose.model("Discussion", DiscussionSchema);
