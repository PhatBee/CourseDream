const PaymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  amount: Number,
  method: { type: String, enum: ["vnpay", "momo", "stripe"] },
  status: { type: String, enum: ["success", "pending", "fail"], default: "pending" },
  transactionId: String
}, { timestamps: true });

module.export = moongose.model('Payment', PaymentSchema);