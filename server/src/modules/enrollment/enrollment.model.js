const EnrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  enrolledAt: { type: Date, default: Date.now }
});

module.export = mongoose.model('Enrollment', EnrollmentSchema);

// Sinh ra khi thanh toán thành công 