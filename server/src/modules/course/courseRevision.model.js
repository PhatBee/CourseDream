import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: String
}, { _id: false });

const LectureSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,   // CDN URL hoặc S3 key (không phải signed URL)
  duration: Number,
  order: Number,
  isPreviewFree: Boolean,
  resources: [ResourceSchema],
  // ── Quiz data (lưu cùng bài giảng trong revision) ────────────────────────
  quizzes: [{
    question:      String,
    options:       [{ id: String, text: String }],
    correctAnswer: String, // 'A' | 'B' | 'C' | 'D'
    hint:          String,
    timestamp:     Number,
    isActive:      { type: Boolean, default: true },
  }],
}, { _id: false });

const SectionSchema = new mongoose.Schema({
  title: String,
  order: Number,
  lectures: [LectureSchema]
}, { _id: false });

/**
 * CourseRevision: Bản nháp / submission của Instructor
 *
 * Trạng thái (theo plan_2.md):
 * - draft              : Đang soạn thảo, chưa gửi duyệt
 * - pending            : Đã gửi, chờ admin duyệt
 * - changes_requested  : Admin yêu cầu sửa (Case 3: bị trả về sửa)
 * - approved           : Đã được duyệt và apply vào Course
 * - rejected           : Bị từ chối hoàn toàn (nặng hơn changes_requested)
 * - archived           : Đã lưu trữ (version cũ sau khi publish version mới)
 */
const CourseRevisionSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },

  status: {
    type: String,
    enum: ['draft', 'pending', 'changes_requested', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },

  version: { type: Number, default: 1 },

  data: {
    title: String,
    slug: String,
    thumbnail: String,
    previewUrl: String,
    shortDescription: String,
    description: String,
    price: Number,
    priceDiscount: Number,
    level: String,
    language: String,

    learnOutcomes: [String],
    requirements: [String],
    audience: [String],
    includes: [String],

    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    sections: [SectionSchema]
  },

  // Feedback từ Admin (dùng cho cả changes_requested và rejected)
  reviewMessage: String,

  // Lịch sử feedback (để instructor xem được các lần sửa trước)
  reviewHistory: [{
    message: String,
    action: { type: String, enum: ['changes_requested', 'rejected'] },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  submittedAt: { type: Date, default: null }, // Thời điểm gửi duyệt

}, { timestamps: true });

export default mongoose.model('CourseRevision', CourseRevisionSchema);
