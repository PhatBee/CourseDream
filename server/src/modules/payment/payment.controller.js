import * as paymentService from './payment.service.js';
import * as vnpayService from './vnpay.service.js';
import cartService from '../cart/cart.service.js';
import * as momoService from './momo.service.js';
import * as zalopayService from './zalopay.service.js';
// Giả sử bạn đã có enrollment service, nếu chưa hãy xem phần dưới
import enrollmentService from '../enrollment/enrollment.service.js';
import moment from 'moment';

// Helper function to build redirect URL based on platform
const buildRedirectUrl = (platform, queryParams) => {
    const baseUrl = platform === 'mobile'
        ? process.env.MOBILE_RETURN_URL
        : process.env.WEB_RETURN_URL;

    const queryString = new URLSearchParams(queryParams).toString();
    return `${baseUrl}?${queryString}`;
};

export const createPaymentUrl = async (req, res) => {
    try {
        const { amount, bankCode, language, courseIds, platform = 'web' } = req.body;
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
            // Kiểm tra xem đơn hàng đã xử lý chưa để tránh xử lý trùng
            if (payment.status !== 'success') {
                // 2. Cập nhật trạng thái Payment -> Success
                await paymentService.updatePaymentStatus(orderId, 'success', {
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
                const paidCourseIds = payment.courses.map(c => c._id.toString());
                await cartService.removeCoursesFromCart(payment.student, paidCourseIds);
            }

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
        const { amount, language, courseIds, platform = 'web' } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

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
            if (payment.status !== 'success') {
                // 2. Cập nhật trạng thái Payment -> Success
                await paymentService.updatePaymentStatus(orderId, 'success', {
                    transactionNo: momo_Params['transId'],
                    responseCode: momo_Params['resultCode'],
                    transactionStatus: momo_Params['message'],
                    payDate: new Date()
                });

                // 3. Enroll Khóa học
                await enrollmentService.enrollStudent(payment.student, payment.courses);

                // 4. Xóa Giỏ hàng
                const paidCourseIds = payment.courses.map(c => c._id.toString());
                await cartService.removeCoursesFromCart(payment.student, paidCourseIds);
            }

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
        const { amount, courseIds, platform = 'web' } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

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
            if (payment.status !== 'success') {
                // 2. Update DB -> Success
                await paymentService.updatePaymentStatus(app_trans_id, 'success', {
                    transactionStatus: queryResult.message,
                    payDate: new Date()
                });

                // 3. Enroll Course
                await enrollmentService.enrollStudent(payment.student, payment.courses);

                // 4. Clear Cart
                const paidCourseIds = payment.courses.map(c => c._id.toString());
                await cartService.removeCoursesFromCart(payment.student, paidCourseIds);
            }

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
        const { amount, courseIds } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // 1. Validate: Chắc chắn amount là 0 (Backend cần check lại giá gốc DB nếu cần bảo mật cao hơn)
        if (amount !== 0) {
            return res.status(400).json({ message: "Đơn hàng không hợp lệ cho phương thức này" });
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
            orderInfo,
            ipAddr,
            method: 'free', // Method mới
            status: 'success', // Thành công luôn
            payDate: new Date()
        });

        // 3. Enroll Khóa học
        await enrollmentService.enrollStudent(req.user._id, courseIds);

        // 4. Xóa Giỏ hàng
        const paidCourseIds = courseIds.map(id => id.toString());
        await cartService.removeCoursesFromCart(req.user._id, paidCourseIds);

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