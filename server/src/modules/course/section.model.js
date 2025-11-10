const SectionSchema = new mongoose.Schema({
  title: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  order: Number
});

module.export = mongoose.model('Section', SectionSchema);