import mongoose from 'mongoose';

const LectureSchema = new mongoose.Schema({
  title: String,
  videoUrl: String,
  duration: Number, // seconds
  section: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  order: Number,
  isPreviewFree: { type: Boolean, default: false },

  resources: [
    {
      title: String,
      url: String,
      type: String
    }
  ]
}, { timestamps: true });

export default mongoose.model('Lecture', LectureSchema);