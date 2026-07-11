import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // Hỗ trợ nhiều khóa học
  items: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    originalPrice: Number,      // Giá gốc của khóa
    discountPercentage: Number, // % giảm (tiered hoặc 0)
    discountAmount: Number,     // Số tiền giảm
    netPrice: Number,           // Giá sau giảm, chưa VAT
    vatAmount: Number,          // 10% của netPrice
    finalPrice: Number,         // Giá bao gồm VAT học viên thực trả
    instructorShare: Number,    // 70% của netPrice
    adminShare: Number,         // 30% của netPrice
    appliedType: { type: String, enum: ['tiered', 'coupon', 'none'] }
  }],
  orderId: { type: String, required: true, unique: true, index: true }, // vnp_TxnRef - Mã đơn hàng
  amount: { type: Number, required: true }, // Số tiền thanh toán
  method: { type: String, enum: ["vnpay", "momo", "zalopay", "free"], default: "vnpay" },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  }, // 0: pending, 1: success, 2: failed

  // VNPAY specific fields
  transactionNo: { type: String, index: true }, // vnp_TransactionNo - Mã giao dịch tại VNPAY
  bankCode: String, // vnp_BankCode
  bankTranNo: String, // vnp_BankTranNo
  cardType: String, // vnp_CardType
  payDate: Date, // vnp_PayDate
  responseCode: String, // vnp_ResponseCode
  transactionStatus: String, // vnp_TransactionStatus
  orderInfo: String, // vnp_OrderInfo - Mô tả đơn hàng

  // Metadata đơn hàng và khuyến mãi
  originalPrice: { type: Number }, // Tổng tiền gốc
  discountAmount: { type: Number, default: 0 }, // Số tiền được giảm
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion" }, // Mã giảm giá đã dùng
  discountType: { type: String, enum: ['tiered', 'coupon', 'none'], default: 'none' }, // Loại khuyến mãi được áp dụng

  // Metadata hệ thống

  ipAddr: String, // IP address của khách hàng
  locale: { type: String, default: "vn" }, // Ngôn ngữ
  platform: { type: String, enum: ["web", "mobile"], default: "web" }, // Platform
}, { timestamps: true });

export default mongoose.model("Payment", PaymentSchema);