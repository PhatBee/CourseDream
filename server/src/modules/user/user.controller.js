import * as userService from './user.service.js';

/**
 * @desc    Lấy thông tin profile của user hiện tại
 * @route   GET /api/v1/users/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cập nhật thông tin cá nhân (tên, avatar, bio, phone)
 * @route   PUT /api/v1/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Lấy file từ Multer middleware
    const file = req.file;

    // Lấy body (name, bio, phone, deleteAvatar...)
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