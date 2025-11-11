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
    required: true, // Mật khẩu là bắt buộc
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
  expertise: [String], // dành cho instructor
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