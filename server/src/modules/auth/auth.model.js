import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: true, // Nên thêm required
    unique: true,
    lowercase: true, // Nên thêm để đảm bảo tính duy nhất
    trim: true      // Nên thêm để loại bỏ khoảng trắng
  },
  password: {
    type: String,
    required: function () { return this.authProvider === 'local'; },
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local',
  },
  linkedAccounts: [
    {
      provider: { type: String, enum: ["google", "facebook"] },
      providerId: String, // Google user id, Facebook user id
      email: String,
    }
  ],
  phone: {
    type: String,
    default: null,
    sparse: true, // Cho phép nhiều giá trị null
    unique: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["student", "instructor", "admin"],
    default: "student"
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  avatar: String,
  bio: String,

  instructorRejectionReason: {
    type: String,
    default: null
  },

  refreshToken: {
    type: String,
    default: null,
  }
}, { timestamps: true });

/**
 * TỰ ĐỘNG XÓA TÀI LIỆU
 * Tạo một TTL (Time-To-Live) index trên trường `otpExpires`.
 * MongoDB sẽ tự động xóa tài liệu sau 0 giây (expireAfterSeconds: 0)
 * khi thời gian ở `otpExpires` đã trôi qua,
 * NHƯNG CHỈ KHI `isVerified` vẫn là `false`.
 */
UserSchema.index(
  { otpExpires: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { isVerified: false }
  }
);
const User = mongoose.model('User', UserSchema);
export default User;