const CourseSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  thumbnail: String,
  description: String,
  price: Number,
  level: { type: String, enum: ["beginner", "intermediate", "advanced"] },
  language: String,
  requirements: [String],
  learnOutcomes: [String],

  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],

  rating: { type: Number, default: 0 },
  studentsCount: { type: Number, default: 0 },
  totalLectures: { type: Number, default: 0 },
  totalHours: { type: Number, default: 0 },

  status: { type: String, enum: ["draft", "published"], default: "draft" }
}, { timestamps: true });

module.export = mongoose.model('Course', CourseSchema);