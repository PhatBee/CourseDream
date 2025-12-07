import User from '../auth/auth.model.js';
import InstructorApplication from './instructorApplication.model.js';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;

  if (!/[A-Z]/.test(password)) return false;

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  if (!/[0-9]/.test(password)) return false;

  return true;
};

/**
 * Helper: Lấy Public ID từ URL Cloudinary để xóa
 * URL ví dụ: https://res.cloudinary.com/.../upload/v123/avatars/abc.jpg
 * Public ID: avatars/abc
 */
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1];     // abc.jpg
  const folderPart = parts[parts.length - 2];   // avatars
  const fileName = lastPart.split('.')[0];      // abc
  return `${folderPart}/${fileName}`;
};

/**
 * Lấy thông tin profile của user
 */
export const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password -otp -otpExpires -refreshToken');

  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const updateProfile = async (userId, updateData, file) => {

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  const cleanData = {};
  if (updateData.name) cleanData.name = updateData.name;
  if (updateData.bio !== undefined) cleanData.bio = updateData.bio; // Cho phép cập nhật bio rỗng
  if (updateData.phone !== undefined) cleanData.phone = updateData.phone; // Cho phép cập nhật phone rỗng

  // === LOGIC XỬ LÝ ẢNH ===

  // Trường hợp 1: Người dùng muốn XÓA ảnh đại diện (reset về mặc định)
  if (updateData.deleteAvatar === 'true') {
    if (user.avatar) {
      const publicId = getPublicIdFromUrl(user.avatar);
      await deleteFromCloudinary(publicId); // Xóa ảnh cũ trên Cloud
    }
    cleanData.avatar = null; // Hoặc URL ảnh mặc định
  }

  // Trường hợp 2: Người dùng UPLOAD ảnh mới
  else if (file) {
    // 1. Xóa ảnh cũ nếu có (để tiết kiệm dung lượng Cloud)
    if (user.avatar) {
      const publicId = getPublicIdFromUrl(user.avatar);
      await deleteFromCloudinary(publicId);
    }
    // 2. Upload ảnh mới
    const result = await uploadToCloudinary(file.buffer);
    cleanData.avatar = result.secure_url;
  }

  // Cập nhật DB
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: cleanData },
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires -refreshToken');

  return updatedUser;
};

export const updatePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  if (user.authProvider === 'local') {
    if (!user.password) {
      const error = new Error('Tài khoản này không dùng mật khẩu.');
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      const error = new Error('Mật khẩu cũ không chính xác.');
      error.statusCode = 401; // Unauthorized
      throw error;
    }
  }

  if (oldPassword === newPassword) {
    const error = new Error('Mật khẩu mới phải khác mật khẩu cũ.');
    error.statusCode = 400;
    throw error;
  }

  if (!validatePasswordStrength(newPassword)) {
    const error = new Error(
      'Mật khẩu không đủ mạnh. Cần ít nhất 8 ký tự, 1 chữ hoa, và 1 ký tự đặc biệt.'
    );
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.authProvider = 'local';

  await user.save();

  return { message: 'Cập nhật mật khẩu thành công.' };
};

/**
 * Lấy trạng thái đơn đăng ký của user hiện tại
 */
export const getInstructorApplicationStatus = async (userId) => {
  const application = await InstructorApplication.findOne({ user: userId });
  return application; // Trả về null hoặc object application
};

/**
 * Gửi yêu cầu làm giảng viên
 */
export const requestInstructorRole = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  // Tìm đơn cũ
  let application = await InstructorApplication.findOne({ user: userId });

  // Nếu đang pending thì chặn
  if (application && application.status === 'pending') {
    const error = new Error('Yêu cầu của bạn đang được xem xét, vui lòng chờ.');
    error.statusCode = 400;
    throw error;
  }

  // Nếu đã là instructor rồi thì chặn
  if (user.role === 'instructor') {
    const error = new Error('Bạn đã là giảng viên rồi.');
    error.statusCode = 400;
    throw error;
  }

  // Chuẩn bị dữ liệu
  const appData = {
    user: userId,
    bio: data.bio,
    experience: data.experience,
    sampleVideoUrl: data.sampleVideoUrl,
    intendedTopics: data.intendedTopics ? data.intendedTopics.split(',').map(t => t.trim()) : [],
    status: 'pending' // Reset về pending nếu trước đó bị reject
  };

  if (application) {
    // Update đơn cũ (trường hợp bị reject và apply lại)
    Object.assign(application, appData);
    await application.save();
  } else {
    // Tạo đơn mới
    application = await InstructorApplication.create(appData);
  }

  return { message: 'Hồ sơ đã được gửi thành công. Vui lòng chờ quản trị viên duyệt.' };
};