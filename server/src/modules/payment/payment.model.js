import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }], // Hỗ trợ nhiều khóa học
  orderId: { type: String, required: true, unique: true, index: true }, // vnp_TxnRef - Mã đơn hàng
  amount: { type: Number, required: true }, // Số tiền thanh toán
  method: { type: String, enum: ["vnpay", "momo", "stripe"], default: "vnpay" },
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

  // Metadata
  ipAddr: String, // IP address của khách hàng
  locale: { type: String, default: "vn" }, // Ngôn ngữ
}, { timestamps: true });

export default mongoose.model("Payment", PaymentSchema);