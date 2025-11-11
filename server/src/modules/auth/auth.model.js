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
  avatar: String,
  bio: String,
  expertise: [String], // dành cho instructor
}, { timestamps: true });

// Sửa từ module.export thành export default
const User = mongoose.model('User', UserSchema);
export default User;