import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: Number,
  comment: String
}, { timestamps: true });

export default mongoose.model('Review', ReviewSchema);