import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema({
    title: String,
    url: String,
    type: String
}, { _id: false });

const LectureSchema = new mongoose.Schema({
    title: String,
    videoUrl: String,
    duration: Number,
    order: Number,
    isPreviewFree: Boolean,
    resources: [ResourceSchema]
}, { _id: false });

const SectionSchema = new mongoose.Schema({
    title: String,
    order: Number,
    lectures: [LectureSchema]
}, { _id: false });

const CourseRevisionSchema = new mongoose.Schema({
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

    status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "draft" },
    version: { type: Number, default: 1 },

    data: {
        title: String,
        slug: String,
        thumbnail: String,
        previewUrl: String,
        shortDescription: String,
        description: String,
        price: Number,
        priceDiscount: Number,
        level: String,
        language: String,

        learnOutcomes: [String],
        requirements: [String],
        audience: [String],
        includes: [String],

        categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

        sections: [SectionSchema] // 🚀 FIX QUAN TRỌNG
    },

    reviewMessage: String
}, { timestamps: true });

export default mongoose.model("CourseRevision", CourseRevisionSchema);
