import mongoose from 'mongoose';
import Lecture from './lecture.model.js';

const SectionSchema = new mongoose.Schema({
  title: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecture" }],
  order: Number
}, { timestamps: true });

export default mongoose.model('Section', SectionSchema);