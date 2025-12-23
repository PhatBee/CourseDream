import mongoose from 'mongoose';

/**
 * Middleware để đảm bảo MongoDB đã kết nối trước khi xử lý request
 * Tránh lỗi "buffering timed out" khi query được gọi trước khi connection sẵn sàng
 */
const ensureDbConnection = async (req, res, next) => {
    // Kiểm tra trạng thái connection
    const state = mongoose.connection.readyState;

    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (state === 1) {
        // Connection đã sẵn sàng
        return next();
    }

    if (state === 2) {
        // Đang connecting, đợi connection hoàn tất
        try {
            await Promise.race([
                // Đợi connection event
                new Promise((resolve) => {
                    mongoose.connection.once('connected', resolve);
                }),
                // Timeout sau 5 giây
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), 5000)
                )
            ]);

            return next();
        } catch (error) {
            console.error('Database connection timeout:', error);
            return res.status(503).json({
                success: false,
                message: 'Database is still connecting. Please try again in a moment.'
            });
        }
    }

    // Disconnected hoặc disconnecting
    console.error('Database not connected. State:', state);
    return res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please try again later.'
    });
};

export default ensureDbConnection;
