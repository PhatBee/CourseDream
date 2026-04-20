import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 }, // Optional

    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },

    likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likesCount: { type: Number, default: 0 },

    instructorReply: {
      comment: { type: String, trim: true },
      repliedAt: { type: Date },
    },
  },
  { timestamps: true },
);

// Hook chống lệch dữ liệu (Data Drift) cho likesCount
reviewSchema.pre("save", function (next) {
  if (this.likedUsers) {
    this.likesCount = this.likedUsers.length;
  }
  next();
});

reviewSchema.index(
  { student: 1, course: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// Index phục vụ Count (đếm tổng số review)
reviewSchema.index({ course: 1, isDeleted: 1, isHidden: 1 });
// Index phục vụ Find & Sort
reviewSchema.index({ course: 1, isDeleted: 1, isHidden: 1, createdAt: -1 });

reviewSchema.index({ course: 1, rating: -1 });
reviewSchema.index({ course: 1, likesCount: -1 });

export default mongoose.model("Review", reviewSchema);
