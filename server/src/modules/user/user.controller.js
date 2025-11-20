import * as userService from './user.service.js';

/**
 * @desc    Cập nhật thông tin cá nhân (tên, avatar, bio)
 * @route   PUT /api/v1/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Lấy file từ Multer middleware
    const file = req.file;

    // Lấy body (name, bio, deleteAvatar...)
    const updateData = req.body;

    // Truyền cả file xuống service
    const updatedUser = await userService.updateProfile(userId, updateData, file);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Thay đổi mật khẩu
 * @route   PUT /api/v1/users/password
 */
export const updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      const error = new Error('Vui lòng cung cấp mật khẩu cũ và mới.');
      error.statusCode = 400;
      throw error;
    }

    const result = await userService.updatePassword(
      userId,
      oldPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Student gửi yêu cầu làm Giảng viên
 * @route   POST /api/users/profile/become-instructor
 */
export const requestInstructorRole = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      const error = new Error('Vui lòng cung cấp lý do/kinh nghiệm.');
      error.statusCode = 400;
      throw error;
    }

    const result = await userService.requestInstructorRole(userId, reason);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};