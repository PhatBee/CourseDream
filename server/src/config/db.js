import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Các option dưới là mặc định từ Mongoose v7 nên không cần nữa
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // Tăng thời gian chờ
      serverSelectionTimeoutMS: 60000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Dừng server nếu kết nối thất bại
  }
};

export default connectDB;
