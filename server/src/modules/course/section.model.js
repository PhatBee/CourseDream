import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema({
  title: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  order: Number
});

const Section = mongoose.model('Section', SectionSchema);

export default Section;