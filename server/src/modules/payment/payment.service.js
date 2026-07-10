import mongoose from "mongoose";
import Payment from "./payment.model.js";

/**
 * Tạo đơn hàng thanh toán mới (Trạng thái Pending)
 */
export const createPayment = async (data) => {
    return await Payment.create(data);
};

/**
 * Cập nhật trạng thái thanh toán sau khi có kết quả từ VNPAY/Momo/ZaloPay
 */
export const updatePaymentStatus = async (orderId, status, paymentDetails) => {
    // Tìm đơn hàng đang pending
    const payment = await Payment.findOne({ orderId, status: 'pending' }).populate('courses');
    if (!payment) return null;

    let updateData = {
        status,
        ...paymentDetails
    };

    if (status === 'success') {
        // Đảm bảo các giá trị trong items được điền đầy đủ
        if (payment.items && payment.items.length > 0) {
            payment.items = payment.items.map(item => {
                const originalPrice = item.originalPrice ?? 0;
                const discountAmount = item.discountAmount ?? 0;
                const netPrice = item.netPrice ?? (originalPrice - discountAmount);
                const vatAmount = item.vatAmount ?? Math.round(netPrice * 0.1);
                const finalPrice = item.finalPrice ?? (netPrice + vatAmount);
                const instructorShare = item.instructorShare ?? Math.round(netPrice * 0.7);
                const adminShare = item.adminShare ?? (netPrice - instructorShare);
                return {
                    ...item.toObject ? item.toObject() : item,
                    originalPrice,
                    discountAmount,
                    netPrice,
                    vatAmount,
                    finalPrice,
                    instructorShare,
                    adminShare
                };
            });
            updateData.items = payment.items;
        } else if (payment.courses && payment.courses.length > 0) {
            // Trường hợp items bị trống nhưng có courses (fallback)
            const Course = mongoose.model('Course');
            const coursesData = await Course.find({ _id: { $in: payment.courses } });
            
            const totalCoursePrice = coursesData.reduce((sum, c) => sum + (c.priceDiscount ?? c.price ?? 0), 0);
            const totalAmount = payment.amount ?? 0; // finalPrice thực tế của toàn bộ payment (bao gồm VAT)

            const newItems = [];
            let remainingAmount = totalAmount;

            coursesData.forEach((course, idx) => {
                const cPrice = course.priceDiscount ?? course.price ?? 0;
                let itemFinalPrice = 0;

                if (totalCoursePrice > 0) {
                    if (idx === coursesData.length - 1) {
                        itemFinalPrice = remainingAmount;
                    } else {
                        itemFinalPrice = Math.round((cPrice / totalCoursePrice) * totalAmount);
                        remainingAmount -= itemFinalPrice;
                    }
                }

                const netPrice = Math.round(itemFinalPrice / 1.1);
                const vatAmount = itemFinalPrice - netPrice;
                const instructorShare = Math.round(netPrice * 0.7);
                const adminShare = netPrice - instructorShare;

                newItems.push({
                    course: course._id,
                    originalPrice: course.price ?? 0,
                    discountPercentage: course.priceDiscount && course.price ? Math.round(((course.price - course.priceDiscount) / course.price) * 100) : 0,
                    discountAmount: (course.price ?? 0) - (course.priceDiscount ?? course.price ?? 0),
                    netPrice,
                    vatAmount,
                    finalPrice: itemFinalPrice,
                    instructorShare,
                    adminShare,
                    appliedType: 'none'
                });
            });

            updateData.items = newItems;
        }
    }

    return await Payment.findOneAndUpdate(
        { orderId, status: 'pending' },
        updateData,
        { new: true }
    ).populate('student courses');
};

/**
 * Lấy thông tin thanh toán theo OrderId
 */
export const getPaymentByOrderId = async (orderId) => {
    return await Payment.findOne({ orderId }).populate('courses');
};