import express from 'express';
import * as userController from './user.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.put(
  '/profile',
  verifyToken, 
  userController.updateProfile
);

router.put(
  '/password',
  verifyToken,
  userController.updatePassword
);

router.post(
  '/profile/become-instructor',
  verifyToken,
  checkRole('student'),
  userController.requestInstructorRole
);

export default router;