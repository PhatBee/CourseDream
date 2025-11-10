import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/db.js";


const PORT = process.env.PORT || 5000;

connectDB(); // ✅ Connect MongoDB trước khi khởi động server

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});