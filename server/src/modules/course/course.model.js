import mongoose from 'mongoose';
import Category from '../category/category.model.js';
import Section from './section.model.js';

const CourseSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  thumbnail: String,
  previewUrl: String,
  shortDescription: String,
  topics: [String],
  includes: [String],
  audience: [String],
  description: String,
  price: {
    type: Number,
    default: 0
  },
  priceDiscount: {
    type: Number,
    default: function () {
      return this.price;
    },
    validate: {
      validator: function (val) {
        return val <= this.price;
      },
      message: "Discount price cannot be higher than original price!"
    }
  },
  level: { type: String, enum: ["beginner", "intermediate", "advanced", "alllevels"] },
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
  totalDurationSeconds: { type: Number, default: 0 },

  status: { type: String, enum: ["draft", "pending", "published", "hidden"], default: "draft" }
}, { timestamps: true });

export default mongoose.model('Course', CourseSchema);