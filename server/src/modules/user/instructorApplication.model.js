import mongoose from 'mongoose';

const InstructorApplicationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bio: String,
    experience: String,
    sampleVideoUrl: String,
    intendedTopics: [String],
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

const InstructorApplication = mongoose.model("InstructorApplication", InstructorApplicationSchema);
export default InstructorApplication;

