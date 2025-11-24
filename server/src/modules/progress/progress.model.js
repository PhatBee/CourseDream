import mongoose from 'mongoose';

const ProgressSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  completedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  percentage: { type: Number, default: 0 }
}, { timestamps: true });

ProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Progress', ProgressSchema);