import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: { type: String, enum: ['link', 'file'], default: 'link' }
}, { _id: false });

// ── Quiz: một lựa chọn (A/B/C/D) ────────────────────────────────────────────
const QuizOptionSchema = new mongoose.Schema({
  id:   { type: String, required: true }, // 'A' | 'B' | 'C' | 'D'
  text: { type: String, required: true },
}, { _id: false });

// ── Quiz: gắn theo mốc timestamp của video ───────────────────────────────────
const QuizSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options:       { type: [QuizOptionSchema], default: [] },
  correctAnswer: { type: String, required: true }, // 'A' | 'B' | 'C' | 'D'
  hint:          { type: String, default: '' },     // Gợi ý khi trả lời sai
  timestamp:     { type: Number, required: true, default: 0 }, // Giây trong video
  isActive:      { type: Boolean, default: true },  // Admin có thể vô hiệu hoá
}, { timestamps: true });

const LectureSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  duration: Number, // seconds
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  order: Number,
  isPreviewFree: { type: Boolean, default: false },

  resources: [ResourceSchema],

  // ── Interactive Quiz gắn với mốc thời gian ──────────────────────────────
  quizzes: { type: [QuizSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Lecture', LectureSchema);