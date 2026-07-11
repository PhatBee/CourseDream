import enrollmentService from "./enrollment.service.js";
import * as paymentService from "../payment/payment.service.js";
import * as vnpayService from "../payment/vnpay.service.js";
import * as momoService from "../payment/momo.service.js";
import * as zalopayService from "../payment/zalopay.service.js";
import moment from "moment";

export const getMyEnrollments = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const enrollments = await enrollmentService.getMyEnrollments(user._id);

    return res.json({ total: enrollments.length, enrollments });
  } catch (err) {
    next(err);
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const dashboardData = await enrollmentService.getStudentDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateCourse = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id || req.user._id;

    const enrollment = await enrollmentService.activateCourse(enrollmentId, userId);

    res.status(200).json({
      success: true,
      message: "Kích hoạt khóa học thành công",
      enrollment
    });
  } catch (err) {
    next(err);
  }
};

export const extendCourse = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { packageId, paymentMethod = 'vnpay', platform = 'web', language = 'vn' } = req.body; 
    const userId = req.user.id || req.user._id;

    const result = await enrollmentService.extendCourse(enrollmentId, userId, packageId);

    // Nếu là gia hạn miễn phí (hoặc không tính phí)
    if (!result.isPaid) {
      return res.status(200).json({
        success: true,
        isPaid: false,
        message: `Gia hạn khóa học thành công thêm ${result.weeksAdded} tuần (Miễn phí)!`,
        enrollment: result.enrollment
      });
    }

    // Nếu gia hạn tính phí, tiến hành tạo đơn hàng và trả về link thanh toán
    const ipAddr = req.headers['x-forwarded-for'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   req.connection.socket?.remoteAddress;

    // Tạo mã đơn hàng unique
    const date = new Date();
    let orderId = '';
    
    if (paymentMethod === 'zalopay') {
      const transID = Math.floor(Math.random() * 1000000);
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (`0${date.getMonth() + 1}`).slice(-2);
      const dd = (`0${date.getDate()}`).slice(-2);
      orderId = `${yy}${mm}${dd}_${transID}`;
    } else if (paymentMethod === 'momo') {
      orderId = 'MOMO' + moment(date).format('HHmmss') + Math.floor(Math.random() * 1000);
    } else {
      orderId = 'EXT' + moment(date).format('HHmmss') + Math.floor(Math.random() * 1000);
    }

    const orderInfo = `Gia han khoa hoc: ${result.enrollment.course.title}`;
    const amount = result.priceCharged;

    // 1. Tạo bản ghi Payment trong DB (Trạng thái Pending)
    await paymentService.createPayment({
      student: userId,
      courses: [result.enrollment.course._id],
      orderId,
      amount,
      originalPrice: amount,
      discountAmount: 0,
      orderInfo,
      ipAddr,
      locale: language,
      method: paymentMethod,
      status: 'pending',
      platform,
      paymentType: 'extension',
      extensionMetadata: {
        enrollmentId: result.enrollment._id,
        packageId: packageId,
        extensionWeeks: result.weeksAdded
      }
    });

    // 2. Tạo URL thanh toán dựa trên phương thức
    let paymentUrl = '';
    if (paymentMethod === 'vnpay') {
      paymentUrl = await vnpayService.createPaymentUrl({
        amount,
        orderId,
        orderInfo,
        ipAddr,
        language,
        platform
      });
    } else if (paymentMethod === 'momo') {
      const momoResult = await momoService.createPaymentUrl({
        amount,
        orderId,
        orderInfo,
        ipAddr,
        lang: language
      });
      paymentUrl = momoResult.payUrl;
    } else if (paymentMethod === 'zalopay') {
      const zalopayResult = await zalopayService.createPaymentUrl({
        app_trans_id: orderId,
        amount,
        orderInfo,
        items: [],
        platform
      });
      if (zalopayResult.return_code === 1) {
        paymentUrl = zalopayResult.order_url;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Tạo giao dịch ZaloPay thất bại', 
          detail: zalopayResult 
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Phương thức thanh toán không được hỗ trợ.'
      });
    }

    return res.status(200).json({
      success: true,
      isPaid: true,
      paymentUrl,
      orderId,
      message: 'Tạo liên kết thanh toán thành công.'
    });

  } catch (err) {
    next(err);
  }
};