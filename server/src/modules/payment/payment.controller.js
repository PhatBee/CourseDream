import * as paymentService from './payment.service.js';
import * as vnpayService from './vnpay.service.js';
import cartService from '../cart/cart.service.js';
import * as momoService from './momo.service.js';
import * as zalopayService from './zalopay.service.js';
// Giả sử bạn đã có enrollment service, nếu chưa hãy xem phần dưới
import enrollmentService from '../enrollment/enrollment.service.js';
import moment from 'moment';
import Course from '../course/course.model.js';
import * as promotionService from '../promotion/promotion.service.js';
import Promotion from '../promotion/promotion.model.js';
import notificationService from '../notification/notification.service.js';

// Helper function to calculate price securely
const calculateOrderPricing = async (courseIds, couponCode, userId) => {
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
        throw new Error('Một hoặc nhiều khóa học không tồn tại');
    }

    let originalPrice = courses.reduce((sum, item) => sum + (item.priceDiscount ?? item.price ?? 0), 0); 
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
        const promotion = await Promotion.findOne({ code: couponCode.toUpperCase() });
        if (!promotion) throw new Error("Mã giảm giá không tồn tại");

        // Gọi service để tính toán discountAmount, bắt cả các rules appliesTo, minPrice, v.v.
        const preview = await promotionService.previewPromotion(promotion, courseIds, userId);
        discountAmount = preview.discountAmount;
        couponId = preview.promotionId;
    }

    
    let amountAfterPromo = originalPrice - discountAmount;
    if (amountAfterPromo < 0) amountAfterPromo = 0;

    const tax = amountAfterPromo > 0 ? Math.round(amountAfterPromo * 0.1) : 0;
    let finalPrice = amountAfterPromo + tax;
    
    if (finalPrice > 0 && finalPrice < 1000) {
        finalPrice = 1000;
    }

    return { originalPrice, finalPrice, discountAmount, couponId };
};


// Helper function to build redirect URL based on platform
const buildRedirectUrl = (platform, queryParams) => {
    const baseUrl = platform === 'mobile'
        ? process.env.MOBILE_RETURN_URL
        : process.env.WEB_RETURN_URL;

    const queryString = new URLSearchParams(queryParams).toString();
    return `${baseUrl}?${queryString}`;
};

// Helper function to process payment success (Idempotent)
const processPaymentSuccess = async (payment, transactionDetails) => {
    if (payment.status === 'success') return true; // Already processed

    // 1. Update Payment Status -> Success
    const updatedPayment = await paymentService.updatePaymentStatus(payment.orderId, 'success', {
        ...transactionDetails,
        payDate: transactionDetails.payDate || new Date()
    });

    // Nếu updatedPayment = null, tức là không tìm thấy bản ghi nào đang có status='pending'
    // => Webhook và Return URL đến cùng lúc, thread kia đã xử lý xong rồi. Tránh Race Condition.
    if (!updatedPayment) return true;

    // Get plain string IDs for courses
    const paidCourseIds = payment.courses.map(c => c._id ? c._id.toString() : c.toString());

    // 2. Enroll Courses
    await enrollmentService.enrollStudent(payment.student, paidCourseIds);

    // 3. Update Coupon Usage
    if (payment.couponId) {
        await promotionService.commitPromotion(payment.couponId, payment.student).catch(err => console.error("Commit promotion error:", err));
    }

    // 4. Clear Cart
    await cartService.removeCoursesFromCart(payment.student, paidCourseIds);
    
    // 5. Send Notification
    await notificationService.createNotification({
        recipient: payment.student,
        type: "purchase_success",
        title: "Thanh toán thành công",
        message: "Cảm ơn bạn đã mua khóa học. Chúc bạn có những giờ học tập hiệu quả!"
    }).catch(err => console.error("Lỗi gửi thông báo mua hàng:", err));

    return true;
};

export const createPaymentUrl = async (req, res) => {
    try {
        const { bankCode, language, courseIds, platform = 'web', couponCode } = req.body;
        // Lấy IP thật của user (quan trọng với VNPAY)
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        // Tính toán lại giá tiền an toàn trên backend
        const { originalPrice, finalPrice: amount, discountAmount, couponId } = await calculateOrderPricing(courseIds, couponCode, req.user._id);

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
            originalPrice,
            discountAmount,
            couponId,
            orderInfo,
            ipAddr,
            locale: language,
            method: 'vnpay',
            status: 'pending',
            platform // Store platform in DB
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
            // Redirect về client với lỗi
            const redirectUrl = buildRedirectUrl(payment?.platform || 'web', {
                success: 'false',
                message: 'Payment not found',
                method: 'vnpay'
            });
            return res.redirect(redirectUrl);
        }

        if (verifyResult.isSuccess) {
            await processPaymentSuccess(payment, {
                transactionNo: vnp_Params['vnp_TransactionNo'],
                bankCode: vnp_Params['vnp_BankCode'],
                payDate: vnp_Params['vnp_PayDate'] ? moment(vnp_Params['vnp_PayDate'], 'YYYYMMDDHHmmss').toDate() : new Date(),
                responseCode: vnp_Params['vnp_ResponseCode']
            });

            // Redirect về client với thành công
            const redirectUrl = buildRedirectUrl(payment.platform, {
                success: 'true',
                message: 'Thanh toán thành công',
                method: 'vnpay',
                orderId: orderId,
                amount: payment.amount,
                responseCode: vnp_Params['vnp_ResponseCode']
            });
            return res.redirect(redirectUrl);
        } else {
            // Thanh toán thất bại hoặc lỗi checksum
            await paymentService.updatePaymentStatus(orderId, 'failed', {
                responseCode: vnp_Params['vnp_ResponseCode']
            });

            // Redirect về client với thất bại
            const redirectUrl = buildRedirectUrl(payment.platform, {
                success: 'false',
                message: 'Thanh toán thất bại hoặc chữ ký không hợp lệ',
                method: 'vnpay',
                orderId: orderId,
                responseCode: vnp_Params['vnp_ResponseCode']
            });
            return res.redirect(redirectUrl);
        }
    } catch (error) {
        console.error('VNPAY return error:', error);
        // Redirect về client với lỗi
        const redirectUrl = buildRedirectUrl('web', {
            success: 'false',
            message: 'Lỗi xử lý kết quả thanh toán',
            method: 'vnpay',
            responseCode: '99'
        });
        return res.redirect(redirectUrl);
    }
};

/**
 * Tạo URL thanh toán chung (Chuyển hướng dựa trên method)
 * Ở đây tạo endpoint riêng cho MoMo cho rõ ràng.
 */
export const createMomoPaymentUrl = async (req, res) => {
    try {
        const { language, courseIds, platform = 'web', couponCode } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Tính toán lại giá tiền an toàn trên backend
        const { originalPrice, finalPrice: amount, discountAmount, couponId } = await calculateOrderPricing(courseIds, couponCode, req.user._id);

        // Tạo mã đơn hàng unique (Momo yêu cầu unique requestId và orderId)
        const date = new Date();
        const orderId = 'MOMO' + moment(date).format('HHmmss') + Math.floor(Math.random() * 1000);
        const orderInfo = `Thanh toan khoa hoc DreamsLMS`;

        // 1. Tạo bản ghi Payment trong DB
        await paymentService.createPayment({
            student: req.user._id,
            courses: courseIds,
            orderId,
            amount,
            originalPrice,
            discountAmount,
            couponId,
            orderInfo,
            ipAddr,
            locale: language,
            method: 'momo',
            status: 'pending',
            platform // Store platform in DB
        });

        // 2. Tạo URL MoMo
        const result = await momoService.createPaymentUrl({
            amount,
            orderId,
            orderInfo,
            ipAddr,
            lang: language
        });

        // result.payUrl là link redirect
        res.status(200).json({ paymentUrl: result.payUrl });

    } catch (error) {
        console.error('Create MoMo payment error:', error);
        res.status(500).json({ message: 'Error creating MoMo payment', error: error.message });
    }
};

/**
 * Xử lý kết quả trả về từ MoMo
 */
export const momoReturn = async (req, res) => {
    try {
        const momo_Params = req.query;

        // 1. Xác thực chữ ký
        const verifyResult = momoService.verifyReturnUrl(momo_Params);
        const orderId = momo_Params['orderId'];

        // Tìm payment trong DB
        const payment = await paymentService.getPaymentByOrderId(orderId);
        if (!payment) {
            // Redirect về client với lỗi
            const redirectUrl = buildRedirectUrl(payment?.platform || 'web', {
                success: 'false',
                message: 'Payment not found',
                method: 'momo'
            });
            return res.redirect(redirectUrl);
        }

        if (verifyResult.isSuccess) {
            await processPaymentSuccess(payment, {
                transactionNo: momo_Params['transId'],
                responseCode: momo_Params['resultCode'],
                transactionStatus: momo_Params['message'],
                payDate: new Date()
            });

            // Redirect về client với thành công
            const redirectUrl = buildRedirectUrl(payment.platform, {
                success: 'true',
                message: 'Thanh toán MoMo thành công',
                method: 'momo',
                orderId: orderId,
                amount: payment.amount,
                responseCode: momo_Params['resultCode'],
            });
            return res.redirect(redirectUrl);
        } else {
            // Thanh toán thất bại
            await paymentService.updatePaymentStatus(orderId, 'failed', {
                responseCode: momo_Params['resultCode'],
                transactionStatus: momo_Params['message']
            });

            // Redirect về client với thất bại
            const redirectUrl = buildRedirectUrl(payment.platform, {
                success: 'false',
                message: 'Thanh toán MoMo thất bại',
                method: 'momo',
                orderId: orderId,
                responseCode: momo_Params['resultCode'],
            });
            return res.redirect(redirectUrl);
        }
    } catch (error) {
        console.error('MoMo return error:', error);
        // Redirect về client với lỗi
        const redirectUrl = buildRedirectUrl('web', {
            success: 'false',
            message: 'Lỗi xử lý MoMo return',
            method: 'momo',
            responseCode: '99'
        });
        return res.redirect(redirectUrl);
    }
};

/**
 * Tạo URL thanh toán ZaloPay
 */
export const createZaloPayPaymentUrl = async (req, res) => {
    try {
        const { courseIds, platform = 'web', couponCode } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Tính toán lại giá tiền an toàn trên backend
        const { originalPrice, finalPrice: amount, discountAmount, couponId } = await calculateOrderPricing(courseIds, couponCode, req.user._id);

        // Tạo mã giao dịch theo format ZaloPay yêu cầu: YYMMDD_xxxx
        const transID = Math.floor(Math.random() * 1000000);
        const date = new Date();
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (`0${date.getMonth() + 1}`).slice(-2);
        const dd = (`0${date.getDate()}`).slice(-2);
        const app_trans_id = `${yy}${mm}${dd}_${transID}`;

        const orderInfo = `Thanh toan khoa hoc DreamsLMS #${transID}`;

        // 1. Tạo bản ghi Payment (Lưu app_trans_id vào orderId)
        await paymentService.createPayment({
            student: req.user._id,
            courses: courseIds,
            orderId: app_trans_id, // Lưu mã này để query
            amount,
            originalPrice,
            discountAmount,
            couponId,
            orderInfo,
            ipAddr,
            method: 'zalopay',
            status: 'pending',
            platform // Store platform in DB
        });

        // 2. Gọi ZaloPay
        const result = await zalopayService.createPaymentUrl({
            app_trans_id,
            amount,
            orderInfo,
            items: [], // Có thể truyền danh sách course nếu muốn,
            platform
        });

        if (result.return_code === 1) {
            res.status(200).json({ paymentUrl: result.order_url });
        } else {
            res.status(400).json({ message: 'Tạo giao dịch ZaloPay thất bại', detail: result });
        }

    } catch (error) {
        console.error('Create ZaloPay error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

/**
 * Xử lý Return từ ZaloPay
 * Frontend sẽ gọi API này kèm theo app_trans_id
 */
export const zalopayReturn = async (req, res) => {
    try {
        const { app_trans_id } = req.query;

        // Tìm đơn hàng trong DB
        const payment = await paymentService.getPaymentByOrderId(app_trans_id);
        if (!payment) {
            // Redirect về client với lỗi
            const redirectUrl = buildRedirectUrl(payment?.platform || 'web', {
                success: 'false',
                message: 'Payment not found',
                method: 'zalopay'
            });
            return res.redirect(redirectUrl);
        }

        // 1. Query trực tiếp sang ZaloPay để kiểm tra trạng thái
        const queryResult = await zalopayService.queryOrderStatus(app_trans_id);

        console.log('ZaloPay Query Result:', queryResult);

        if (queryResult.isSuccess) {
            await processPaymentSuccess(payment, {
                transactionStatus: queryResult.message,
                payDate: new Date()
            });

            // Redirect về client với thành công
            const redirectUrl = buildRedirectUrl(payment.platform, {
                success: 'true',
                message: 'Thanh toán ZaloPay thành công',
                method: 'zalopay',
                orderId: app_trans_id,
                amount: payment.amount,

            });
            return res.redirect(redirectUrl);
        } else {
            // Thanh toán thất bại hoặc đang xử lý
            await paymentService.updatePaymentStatus(app_trans_id, 'failed', {
                transactionStatus: queryResult.message
            });

            // Redirect về client với thất bại
            const redirectUrl = buildRedirectUrl(payment.platform, {
                success: 'false',
                message: queryResult.message,
                method: 'zalopay',
                orderId: app_trans_id
            });
            return res.redirect(redirectUrl);
        }

    } catch (error) {
        console.error('ZaloPay return error:', error);
        // Redirect về client với lỗi
        const redirectUrl = buildRedirectUrl('web', {
            success: 'false',
            message: 'Lỗi xử lý ZaloPay return',
            method: 'zalopay'
        });
        return res.redirect(redirectUrl);
    }
};

/**
 * Xử lý đơn hàng 0 đồng (Miễn phí)
 */
export const createFreeEnrollment = async (req, res) => {
    try {
        const { courseIds, couponCode } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Tính toán lại giá tiền an toàn trên backend
        const { originalPrice, finalPrice: amount, discountAmount, couponId } = await calculateOrderPricing(courseIds, couponCode, req.user._id);

        // 1. Validate: Chắc chắn amount là 0 (Backend tự tính)
        if (amount !== 0) {
            return res.status(400).json({ message: "Đơn hàng không hợp lệ cho phương thức này. Số tiền phải bằng 0." });
        }

        const date = new Date();
        const orderId = 'FREE' + moment(date).format('HHmmss') + Math.floor(Math.random() * 1000);
        const orderInfo = `Ghi danh mien phi ${orderId}`;

        // 2. Tạo bản ghi Payment (Status: success ngay lập tức)
        const payment = await paymentService.createPayment({
            student: req.user._id,
            courses: courseIds,
            orderId,
            amount: 0,
            originalPrice,
            discountAmount,
            couponId,
            orderInfo,
            ipAddr,
            method: 'free', // Method mới
            status: 'success', // Thành công luôn
            payDate: new Date()
        });

        // 3. Enroll Khóa học
        await enrollmentService.enrollStudent(req.user._id, courseIds);

        // 4. Cập nhật lượt sử dụng mã giảm giá
        if (couponId) {
            await promotionService.commitPromotion(couponId, req.user._id).catch(err => console.error("Commit promotion error:", err));
        }

        // 5. Xóa Giỏ hàng
        const paidCourseIds = courseIds.map(id => id.toString());
        await cartService.removeCoursesFromCart(req.user._id, paidCourseIds);

        // 6. Gửi thông báo
        await notificationService.createNotification({
            recipient: req.user._id,
            type: "purchase_success",
            title: "Ghi danh thành công",
            message: "Bạn đã ghi danh khóa học miễn phí thành công. Chúc bạn học tập tốt!"
        }).catch(err => console.error("Lỗi gửi thông báo ghi danh:", err));

        res.status(200).json({
            success: true,
            message: 'Ghi danh thành công',
            data: payment
        });

    } catch (error) {
        console.error('Free enrollment error:', error);
        res.status(500).json({ message: 'Lỗi xử lý ghi danh miễn phí', error: error.message });
    }
};

/**
 * ========================================================
 * WEBHOOK / IPN HANDLERS (SERVER-TO-SERVER)
 * ========================================================
 */

export const vnpayIpn = async (req, res) => {
    try {
        const vnp_Params = req.query;
        const verifyResult = vnpayService.verifyReturnUrl(vnp_Params);
        const orderId = vnp_Params['vnp_TxnRef'];

        if (verifyResult.isSuccess) {
            const payment = await paymentService.getPaymentByOrderId(orderId);
            if (payment) {
                await processPaymentSuccess(payment, {
                    transactionNo: vnp_Params['vnp_TransactionNo'],
                    bankCode: vnp_Params['vnp_BankCode'],
                    payDate: vnp_Params['vnp_PayDate'] ? moment(vnp_Params['vnp_PayDate'], 'YYYYMMDDHHmmss').toDate() : new Date(),
                    responseCode: vnp_Params['vnp_ResponseCode']
                });
            }
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('VNPAY IPN error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

export const momoIpn = async (req, res) => {
    try {
        const momo_Params = req.body;
        const verifyResult = momoService.verifyReturnUrl(momo_Params);
        const orderId = momo_Params['orderId'];

        if (verifyResult.isSuccess) {
            const payment = await paymentService.getPaymentByOrderId(orderId);
            if (payment && momo_Params['resultCode'] === 0) {
                await processPaymentSuccess(payment, {
                    transactionNo: momo_Params['transId'],
                    responseCode: momo_Params['resultCode'],
                    transactionStatus: momo_Params['message'],
                    payDate: new Date()
                });
            } else if (payment && momo_Params['resultCode'] !== 0) {
                await paymentService.updatePaymentStatus(orderId, 'failed', {
                    responseCode: momo_Params['resultCode'],
                    transactionStatus: momo_Params['message']
                });
            }
            return res.status(200).json({ message: 'OK' }); // MoMo yêu cầu 204 hoặc 200
        } else {
            return res.status(400).json({ message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('MoMo IPN error:', error);
        return res.status(500).json({ message: 'Unknown error' });
    }
};

export const zalopayIpn = async (req, res) => {
    try {
        const dataStr = req.body.data;
        const reqMac = req.body.mac;
        const verifyResult = zalopayService.verifyCallback(dataStr, reqMac);
        
        if (verifyResult.isSuccess) {
            const dataObj = JSON.parse(dataStr);
            const app_trans_id = dataObj['app_trans_id'];
            const payment = await paymentService.getPaymentByOrderId(app_trans_id);
            
            if (payment) {
                await processPaymentSuccess(payment, {
                    transactionNo: dataObj['zp_trans_id'],
                    transactionStatus: 'Success IPN',
                    payDate: new Date()
                });
            }
            return res.status(200).json({ return_code: 1, return_message: "success" });
        } else {
            return res.status(200).json({ return_code: -1, return_message: "mac not equal" });
        }
    } catch (error) {
        console.error('ZaloPay IPN error:', error);
        return res.status(200).json({ return_code: 0, return_message: error.message });
    }
};