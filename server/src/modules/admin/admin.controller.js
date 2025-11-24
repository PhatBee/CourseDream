// src/modules/admin/admin.controller.js
import * as adminService from './admin.service.js';

export const getPendingApplications = async (req, res, next) => {
  try {
    const applications = await adminService.getPendingApplications();
    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewApplication = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const { decision, adminNotes } = req.body;

    if (!decision) {
      const error = new Error('Vui lòng cung cấp quyết định (approve/reject).');
      error.statusCode = 400;
      throw error;
    }

    const result = await adminService.reviewApplication(
      targetUserId, 
      decision, 
      adminNotes
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};