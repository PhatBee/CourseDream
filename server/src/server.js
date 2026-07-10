import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import checkPaymentStatus from "./cron/checkPaymentStatus.js";
import "./modules/notification/reminder.js";
import { initSocket } from "./modules/socket/index.js";


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // ✅ Run cron job
  checkPaymentStatus();


  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
  // ✅ Initialize WebSocket
  initSocket(server);
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1); // Dừng server nếu kết nối thất bại
});