import crypto from 'crypto';
import mongoose from 'mongoose';
import Promotion from './promotion.model.js';
import Enrollment from '../enrollment/enrollment.model.js';
import Payment from '../payment/payment.model.js';
import User from '../auth/auth.model.js';

/**
 * Tự động sinh mã voucher phần thưởng (độc quyền 7 ngày, giảm 7% cho tất cả khóa học)
 * khi học viên hoàn thành khóa học đúng tiến độ.
 * 
 * @param {string} userId - ID học viên
 * @param {string} courseId - ID khóa học vừa hoàn thành
 * @returns {Promise<object|null>} Trả về voucher object nếu được tạo, ngược lại null.
 */
export const generateCourseCompletionReward = async (userId, courseId) => {
  try {
    // 1. Kiểm tra User Role = "student"
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      console.log(`[Reward] Bỏ qua vì user không phải student hoặc không tồn tại (User ID: ${userId})`);
      return null;
    }

    // 2. Kiểm tra Enrollment: T_current <= T_expired_course
    const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
    if (!enrollment) {
      console.log(`[Reward] Không tìm thấy Enrollment của học viên ${userId} đối với khóa ${courseId}`);
      return null;
    }

    // Nếu khóa học đã quá hạn
    const now = new Date();
    if (enrollment.endedAt && now > enrollment.endedAt) {
      console.log(`[Reward] Học viên ${userId} hoàn thành khóa ${courseId} quá hạn (Hết hạn lúc: ${enrollment.endedAt})`);
      return null;
    }

    // 3. Kiểm tra P_paid > 0 (Đơn hàng thành công, có phí)
    const payment = await Payment.findOne({
      student: userId,
      status: 'success',
      $or: [
        { courses: courseId, amount: { $gt: 0 } },
        { "items.course": courseId, "items.finalPrice": { $gt: 0 } }
      ]
    });

    if (!payment) {
      console.log(`[Reward] Khóa học ${courseId} là miễn phí hoặc không tìm thấy thanh toán có phí thành công của học viên ${userId}`);
      return null;
    }

    // 4. Kiểm tra mã cho cặp (User, Course) này = Chưa từng tồn tại
    const existingPromotion = await Promotion.findOne({
      targetStudent: userId,
      sourceCourse: courseId,
      isDynamicReward: true
    });

    if (existingPromotion) {
      console.log(`[Reward] Voucher phần thưởng cho học viên ${userId} và khóa ${courseId} đã tồn tại`);
      return null;
    }

    // 5. Thỏa mãn toàn bộ điều kiện -> Sinh mã voucher 7 ngày
    const rewardCode = `REWARD_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ngày sau

    const newPromotion = new Promotion({
      code: rewardCode,
      description: `Ưu đãi hoàn thành khóa học đúng tiến độ`,
      discountType: 'percent',
      discountValue: 7, // Mã 7% theo yêu cầu của user
      appliesTo: 'all',
      startDate,
      endDate,
      maxUsage: 1,
      maxUsagePerUser: 1,
      isDynamicReward: true,
      targetStudent: userId,
      sourceCourse: courseId,
      status: 'ACTIVE',
      isActive: true
    });

    const createdReward = await newPromotion.save();
    console.log(`[Reward] Đã tự động sinh mã voucher ${rewardCode} thành công cho học viên ${userId}`);
    return createdReward;
  } catch (error) {
    console.error(`[Reward] Lỗi khi tạo voucher phần thưởng:`, error);
    return null;
  }
};
