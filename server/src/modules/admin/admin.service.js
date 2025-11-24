// src/modules/admin/admin.service.js
import User from '../auth/auth.model.js';

export const getPendingApplications = async () => {
  const applications = await User.find({ 
    'instructorApplication.status': 'pending' 
  })
  .select('name email avatar instructorApplication');

  return applications;
};

/**
 * Service: Admin duyệt (approve/reject) yêu cầu
 * @param {string} targetUserId - ID của user được duyệt
 * @param {string} decision - 'approve' hoặc 'reject'
 * @param {string} adminNotes - Ghi chú của Admin
 */
export const reviewApplication = async (targetUserId, decision, adminNotes) => {
  const user = await User.findById(targetUserId);

  if (!user || user.instructorApplication.status !== 'pending') {
    const error = new Error('Không tìm thấy yêu cầu hoặc yêu cầu đã được xử lý.');
    error.statusCode = 404;
    throw error;
  }

  if (decision === 'approve') {
    user.role = 'instructor';
    user.instructorApplication.status = 'approved';
    user.instructorApplication.reviewedAt = new Date();
    user.instructorApplication.adminNotes = adminNotes;
    
    // thêm thông báo vào email
    
  } else if (decision === 'reject') {
    user.instructorApplication.status = 'rejected';
    user.instructorApplication.reviewedAt = new Date();
    user.instructorApplication.adminNotes = adminNotes;
    
    // thêm logic thông báo vào email
  } else {
    const error = new Error('Quyết định không hợp lệ.');
    error.statusCode = 400;
    throw error;
  }
  
  await user.save();
  return { message: `Đã ${decision} yêu cầu của ${user.name}.` };
};