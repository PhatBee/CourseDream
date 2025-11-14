import User from '../auth/auth.model.js';
import bcrypt from 'bcryptjs';

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  
  if (!/[A-Z]/.test(password)) return false;
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

  if (!/[0-9]/.test(password)) return false;

  return true;
};

export const updateProfile = async (userId, updateData) => {
  const cleanData = {};
  if (updateData.name) cleanData.name = updateData.name;
  if (updateData.avatar) cleanData.avatar = updateData.avatar;
  if (updateData.bio) cleanData.bio = updateData.bio;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: cleanData },
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires');

  if (!updatedUser) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }
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

export const requestInstructorRole = async (userId, reason) => {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'student') {
    const error = new Error('Chỉ có Student mới có thể gửi yêu cầu.');
    error.statusCode = 403; // Forbidden
    throw error;
  }
  
  if (user.instructorApplication.status === 'pending') {
    const error = new Error('Yêu cầu của bạn đang được xem xét.');
    error.statusCode = 400;
    throw error;
  }

  // Cập nhật trạng thái
  user.instructorApplication = {
    status: 'pending',
    reason: reason,
    submittedAt: new Date()
  };
  
  await user.save();
  
  return { message: 'Yêu cầu đã được gửi. Chúng tôi sẽ xem xét sớm.' };
};