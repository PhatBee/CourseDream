import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  thumbnail: String,
  previewUrl: String,
  shortDescription: String,
  topics: [String],
  includes: [String],
  audience: [String],
  description: String,
  price: { type: Number, default: 0 },
  priceDiscount: {
    type: Number,
    default: function () { return this.price; },
    validate: {
      validator: function (val) { return val <= this.price; },
      message: 'Discount price cannot be higher than original price!'
    }
  },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'alllevels'] },
  language: String,
  requirements: [String],
  learnOutcomes: [String],

  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],

  rating: { type: Number, default: 0 },
  studentsCount: { type: Number, default: 0 },
  totalLectures: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },
  totalDurationSeconds: { type: Number, default: 0 },

  /**
   * Trạng thái nghiệp vụ (theo plan_2.md):
   * - draft       : Mới tạo, chưa submit
   * - pending     : Đang chờ admin duyệt
   * - published   : Đã publish (live)
   * - unpublished : Giảng viên hoặc Admin ẩn khỏi marketplace, học viên cũ vẫn truy cập được
   * - hidden      : Ẩn tạm thời (giảng viên tự ẩn, chưa có học viên)
   * - archived    : Lưu trữ (đã có học viên, không nhận đăng ký mới)
   * - suspended   : Bị đình chỉ bởi Admin (vi phạm chính sách)
   * - deleted     : Đã xóa mềm
   */
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'unpublished', 'hidden', 'archived', 'suspended', 'deleted'],
    default: 'draft'
  },

  // Version tracking (đồng bộ với plan_2.md)
  publishedVersionNo: { type: Number, default: null },   // Version live hiện tại
  currentDraftVersionNo: { type: Number, default: 1 },  // Version draft đang soạn

  version: { type: Number, default: 1 }, // Legacy / compat

  // Admin feedback khi suspend
  suspendReason: { type: String, default: null },

  embedding: { type: [Number], select: false },

}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);