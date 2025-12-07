import express from 'express';
import * as userController from './user.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js'
import { upload } from '../../middlewares/upload.middleware.js';
import { validateUpdateProfile } from './user.validation.js';

const router = express.Router();

// GET current user profile
router.get(
  '/profile',
  verifyToken,
  userController.getProfile
);

// UPDATE user profile
router.put(
  '/profile',
  verifyToken,
  upload.single('avatar'),
  validateUpdateProfile,
  userController.updateProfile
);

router.put(
  '/password',
  verifyToken,
  userController.updatePassword
);

router.get('/', userController.getUsers);

// Thêm route GET để lấy trạng thái đơn
router.get(
  '/profile/become-instructor',
  verifyToken,
  userController.getMyInstructorApplication
);

router.post(
  '/profile/become-instructor',
  verifyToken,
  // checkRole('student'), // Có thể bỏ checkRole nếu muốn cho phép check status linh hoạt
  userController.requestInstructorRole
);

export default router;