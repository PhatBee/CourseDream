import mongoose from "mongoose";

// Sử dụng biến global để giữ kết nối không bị khởi tạo lại nhiều lần
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 75000,
      maxPoolSize: 10, // Bản Free của Atlas giới hạn kết nối thấp, nên để 10 là vừa
      minPoolSize: 2,
    };

    // Quan trọng: Không sử dụng process.exit(1) trong Vercel
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", e.message);
    throw e; // Để Vercel ghi nhận lỗi thay vì crash process
  }

  return cached.conn;
};

export default connectDB;
