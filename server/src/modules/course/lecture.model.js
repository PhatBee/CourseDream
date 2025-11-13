import mongoose from "mongoose";

const LectureSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  duration: Number, // seconds
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  order: Number,
  isPreviewFree: { type: Boolean, default: false }
});

const Lecture = mongoose.model('Lecture', LectureSchema)

export default Lecture