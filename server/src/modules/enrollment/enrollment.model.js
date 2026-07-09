import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  enrolledAt: { type: Date, default: Date.now },
  lastViewedAt: { type: Date, default: Date.now },
  isActivated: { type: Boolean, default: false },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('Enrollment', EnrollmentSchema);