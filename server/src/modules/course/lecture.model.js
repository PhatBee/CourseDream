import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  title: String,
  url: String,
  type: { type: String, enum: ['link', 'file'], default: 'link' }
}, { _id: false });

const LectureSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  duration: Number, // seconds
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  order: Number,
  isPreviewFree: { type: Boolean, default: false },

  resources: [ResourceSchema]
}, { timestamps: true });



export default mongoose.model('Lecture', LectureSchema);