import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Cấu hình Cloudinary từ biến môi trường
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Helper: Upload file từ Buffer lên Cloudinary
 * @param {Buffer} buffer - Buffer của file
 * @param {string} folder - Tên thư mục trên Cloudinary
 * @returns {Promise<object>} - Kết quả từ Cloudinary
 */
export const uploadToCloudinary = (buffer, folder = 'avatars') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

/**
 * Helper: Xóa file trên Cloudinary
 * @param {string} publicId - Public ID của ảnh
 */
export const deleteFromCloudinary = async (publicId) => {
    try {
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    } catch (error) {
        console.error("Lỗi xóa ảnh Cloudinary:", error);
    }
};