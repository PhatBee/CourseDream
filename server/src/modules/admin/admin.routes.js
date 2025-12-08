// src/modules/admin/admin.routes.js
import express from 'express';
import * as adminController from './admin.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { checkRole } from '../../middlewares/role.middleware.js';

const router = express.Router();

router.use(verifyToken, checkRole('admin'));

/**
 * @route   GET /api/admin/instructor-applications
 * @desc    Admin lấy danh sách yêu cầu
 * @access  Admin
 */
router.get(
  '/instructor-applications',
  adminController.getPendingApplications
);

/**
 * @route   PUT /api/admin/instructor-applications/:targetUserId
 * @desc    Admin duyệt/từ chối yêu cầu
 * @access  Admin
 */
router.put(
  '/instructor-applications/:targetUserId',
  adminController.reviewApplication
);

router.get(
  '/courses/pending',
  adminController.getPendingCourses
);

router.get(
  '/courses/pending/:revisionId',
  adminController.getPendingCourseDetail
);

router.post(
  '/courses/approve/:revisionId',
  adminController.approveCourseRevision
);

router.post(
  '/courses/reject/:revisionId',
  adminController.rejectCourseRevision
);

export default router;