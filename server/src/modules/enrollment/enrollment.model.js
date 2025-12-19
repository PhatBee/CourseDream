import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  enrolledAt: { type: Date, default: Date.now },
  lastViewedAt: { type: Date, default: Date.now}
}, { timestamps: true });

export default mongoose.model('Enrollment', EnrollmentSchema);