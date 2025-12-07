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

/**
 * @route   GET /api/admin/dashboard-stats
 * @desc    Lấy số liệu tổng quan cho Dashboard
 */
router.get('/dashboard-stats', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/revenue-analytics
 * @desc    Lấy biểu đồ doanh thu
 */
router.get('/revenue-analytics', adminController.getRevenueAnalytics);

/**
 * @route   GET /api/admin/users
 * @desc    Lấy danh sách học viên
 */
router.get('/users', adminController.getStudents);
router.get('/instructors', adminController.getInstructors);

export default router;