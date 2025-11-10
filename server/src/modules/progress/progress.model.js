const ProgressSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  completedLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  percentage: { type: Number, default: 0 }
}, { timestamps: true });

module.export = mongoose.model('Progress', ProgressSchema);