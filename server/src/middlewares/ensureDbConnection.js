import mongoose from 'mongoose';
import connectDB from '../config/db.js'; // Import file chứa hàm connectDB của bạn

const ensureDbConnection = async (req, res, next) => {
    const state = mongoose.connection.readyState;

    // Nếu chưa kết nối (state = 0), hãy thử kết nối ngay lập tức
    if (state === 0) {
        console.log('Database not connected. Attempting to connect...');
        try {
            await connectDB();
        } catch (error) {
            return res.status(503).json({
                success: false,
                message: 'Database connection failed.',
                error: error.message
            });
        }
    }

    // Nếu đang trong quá trình kết nối (state = 2)
    if (mongoose.connection.readyState === 2) {
        try {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
                mongoose.connection.once('connected', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
            return next();
        } catch (error) {
            return res.status(503).json({
                success: false,
                message: 'Database connection timeout.'
            });
        }
    }

    if (mongoose.connection.readyState === 1) {
        return next();
    }

    return res.status(503).json({
        success: false,
        message: `Database state is ${mongoose.connection.readyState}. Please try again.`
    });
};

export default ensureDbConnection;