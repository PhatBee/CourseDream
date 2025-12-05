import mongoose from "mongoose";

const CourseRevisionSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // status của revision
    status: {
        type: String,
        enum: ["draft", "pending", "approved", "rejected"],
        default: "draft"
    },

    // Tăng version mỗi lần gửi duyệt
    version: Number,

    // Toàn bộ dữ liệu course
    data: {
        title: String,
        slug: String,
        thumbnail: String,
        previewUrl: String,
        shortDescription: String,
        topics: [String],
        includes: [String],
        audience: [String],
        description: String,
        price: Number,
        priceDiscount: Number,
        level: String,
        language: String,
        requirements: [String],
        learnOutcomes: [String],
        categories: [mongoose.Schema.Types.ObjectId],

        sections: [
            {
                title: String,
                order: Number,
                lectures: [
                    {
                        title: String,
                        videoUrl: String,
                        duration: Number,
                        order: Number,
                        isPreviewFree: Boolean,
                        resources: [
                            {
                                title: String,
                                url: String,
                                type: String
                            }
                        ]
                    }
                ]
            }
        ]
    },

    reviewMessage: String,

}, { timestamps: true });

export default mongoose.model("CourseRevision", CourseRevisionSchema);
