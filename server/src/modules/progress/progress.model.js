import mongoose from 'mongoose';

/**
 * VideoWatchTime — lưu last_watched_time cho từng bài giảng
 */
const VideoWatchTimeSchema = new mongoose.Schema({
  lecture: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  watchedSeconds: { type: Number, default: 0 },  // Thời gian đã xem (giây)
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

/**
 * CompletedQuiz — lưu quiz đã trả lời đúng của học viên
 */
const CompletedQuizSchema = new mongoose.Schema({
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  quizIndex: { type: Number, required: true }, // vị trí trong lecture.quizzes[]
  answeredAt: { type: Date, default: Date.now },
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  completedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  percentage: { type: Number, default: 0 },
  /** Map lưu thời gian xem của từng bài giảng */
  watchTimes: [VideoWatchTimeSchema],
  /** Danh sách quiz đã trả lời đúng */
  completedQuizzes: { type: [CompletedQuizSchema], default: [] },
}, { timestamps: true });

ProgressSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Progress', ProgressSchema);