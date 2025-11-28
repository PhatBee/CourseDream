// src/models/notification.model.js
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["reply", "report", "system"], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: mongoose.Schema.Types.ObjectId,
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });
export default mongoose.model("Notification", NotificationSchema);