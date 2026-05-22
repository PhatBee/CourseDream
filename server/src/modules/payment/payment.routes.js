import express from 'express';
import * as paymentController from './payment.controller.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Tạo URL thanh toán (Yêu cầu đăng nhập)
router.post('/create_payment_url', verifyToken, paymentController.createPaymentUrl);

// Xử lý kết quả trả về từ VNPAY
// Lưu ý: Route này Frontend gọi sau khi VNPAY redirect về
router.get('/vnpay_return', paymentController.vnpayReturn);

router.post('/create_momo_url', verifyToken, paymentController.createMomoPaymentUrl);
router.get('/momo_return', paymentController.momoReturn);

router.post('/create_zalopay_url', verifyToken, paymentController.createZaloPayPaymentUrl);
router.get('/zalopay_return', paymentController.zalopayReturn);

// Route mới cho đơn hàng 0 đồng
router.post('/create_free_enrollment', verifyToken, paymentController.createFreeEnrollment);

// ==========================================
// IPN / WEBHOOK ROUTES (Server-to-Server)
// ==========================================
// VNPAY gọi IPN bằng method GET
router.get('/vnpay_ipn', paymentController.vnpayIpn);

// MoMo gọi IPN bằng method POST
router.post('/momo_ipn', paymentController.momoIpn);

// ZaloPay gọi IPN bằng method POST
router.post('/zalopay_ipn', paymentController.zalopayIpn);

export default router;