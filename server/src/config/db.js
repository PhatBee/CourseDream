import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Tắt buffering để tránh lỗi timeout khi connection chưa sẵn sàng
    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Tăng thời gian chờ cho production
      serverSelectionTimeoutMS: 60000, // 60 giây để chọn server
      socketTimeoutMS: 75000, // 75 giây timeout cho socket operations
      connectTimeoutMS: 60000, // 60 giây timeout cho initial connection

      // Connection pooling để tối ưu performance
      maxPoolSize: 10, // Số connection tối đa trong pool
      minPoolSize: 2, // Số connection tối thiểu

      // Retry logic
      retryWrites: true,
      retryReads: true,

      // Heartbeat để duy trì connection
      heartbeatFrequencyMS: 10000, // Check connection mỗi 10 giây
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Event listeners để monitor connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Dừng server nếu kết nối thất bại
  }
};

export default connectDB;
