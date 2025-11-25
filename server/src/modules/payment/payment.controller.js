import * as paymentService from './payment.service.js';
import * as vnpayService from './vnpay.service.js';
import cartService from '../cart/cart.service.js';
// Giả sử bạn đã có enrollment service, nếu chưa hãy xem phần dưới
import enrollmentService from '../enrollment/enrollment.service.js';
import moment from 'moment';

export const createPaymentUrl = async (req, res) => {
    try {
        const { amount, bankCode, language, courseIds } = req.body;
        // Lấy IP thật của user (quan trọng với VNPAY)
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // Tạo mã đơn hàng unique
        const date = new Date();
        const orderId = moment(date).format('HHmmss') + Math.floor(Math.random() * 1000);
        const orderInfo = `Thanh toan don hang ${orderId}`;

        // 1. Tạo bản ghi Payment trong DB (Pending)
        await paymentService.createPayment({
            student: req.user._id,
            courses: courseIds,
            orderId,
            amount,
            orderInfo,
            ipAddr,
            locale: language,
            status: 'pending'
        });

        // 2. Tạo URL VNPAY
        const paymentUrl = await vnpayService.createPaymentUrl({
            amount,
            orderId,
            orderInfo,
            ipAddr,
            bankCode,
            language
        });

        res.status(200).json({ paymentUrl });
    } catch (error) {
        console.error('Create payment url error:', error);
        res.status(500).json({ message: 'Error creating payment url', error: error.message });
    }
};

export const vnpayReturn = async (req, res) => {
    try {
        const vnp_Params = req.query;
        // 1. Xác thực chữ ký
        const verifyResult = vnpayService.verifyReturnUrl(vnp_Params);

        const orderId = vnp_Params['vnp_TxnRef'];

        // Tìm payment trong DB
        const payment = await paymentService.getPaymentByOrderId(orderId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (verifyResult.isSuccess) {
            // Kiểm tra xem đơn hàng đã xử lý chưa để tránh xử lý trùng
            if (payment.status === 'success') {
                return res.status(200).json({ success: true, message: 'Payment already processed', data: payment });
            }

            // 2. Cập nhật trạng thái Payment -> Success
            const updatedPayment = await paymentService.updatePaymentStatus(orderId, 'success', {
                transactionNo: vnp_Params['vnp_TransactionNo'],
                bankCode: vnp_Params['vnp_BankCode'],
                payDate: vnp_Params['vnp_PayDate'],
                responseCode: vnp_Params['vnp_ResponseCode']
            });

            // 3. === ENROLL KHÓA HỌC ===
            // (Enroll student vào danh sách course trong payment)
            await enrollmentService.enrollStudent(payment.student, payment.courses);

            // 4. === XÓA GIỎ HÀNG ===
            // (Chỉ xóa những course đã thanh toán khỏi giỏ hàng)
            await cartService.removeCoursesFromCart(payment.student, payment.courses);

            res.status(200).json({
                success: true,
                message: 'Thanh toán thành công',
                data: updatedPayment
            });
        } else {
            // Thanh toán thất bại hoặc lỗi checksum
            await paymentService.updatePaymentStatus(orderId, 'failed', {
                responseCode: vnp_Params['vnp_ResponseCode']
            });

            res.status(400).json({
                success: false,
                message: 'Thanh toán thất bại hoặc chữ ký không hợp lệ',
                data: vnp_Params
            });
        }
    } catch (error) {
        console.error('VNPAY return error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xử lý kết quả thanh toán', error: error.message });
    }
};