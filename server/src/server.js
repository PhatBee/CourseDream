import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";
import checkPaymentStatus from "./cron/checkPaymentStatus.js"


const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  // ✅ Run cron job
  checkPaymentStatus();


  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1); // Dừng server nếu kết nối thất bại
});