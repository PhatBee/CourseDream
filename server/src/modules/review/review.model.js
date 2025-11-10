const ReviewSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: Number,
  comment: String
}, { timestamps: true });

module.export = mongoose.model('Review', ReviewSchema);