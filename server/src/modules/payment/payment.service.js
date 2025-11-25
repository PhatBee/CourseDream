import Payment from "./payment.model.js";

/**
 * Tạo đơn hàng thanh toán mới (Trạng thái Pending)
 */
export const createPayment = async (data) => {
    return await Payment.create(data);
};

/**
 * Cập nhật trạng thái thanh toán sau khi có kết quả từ VNPAY
 */
export const updatePaymentStatus = async (orderId, status, paymentDetails) => {
    return await Payment.findOneAndUpdate(
        { orderId },
        {
            status,
            ...paymentDetails
        },
        { new: true }
    ).populate('student courses'); // Populate để lấy thông tin enroll sau này
};

/**
 * Lấy thông tin thanh toán theo OrderId
 */
export const getPaymentByOrderId = async (orderId) => {
    return await Payment.findOne({ orderId }).populate('courses');
};