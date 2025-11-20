import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Cấu hình Cloudinary từ biến môi trường
const cloudName = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloudinary Config Check:');
console.log('Cloud Name:', cloudName ? 'Exists' : 'Missing');
console.log('API Key:', apiKey ? 'Exists' : 'Missing');
console.log('API Secret:', apiSecret ? 'Exists' : 'Missing');

if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Cloudinary configuration is missing. Please check your .env file.');
}

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

/**
 * Helper: Upload file từ Buffer lên Cloudinary
 * @param {Buffer} buffer - Buffer của file
 * @param {string} folder - Tên thư mục trên Cloudinary
 * @returns {Promise<object>} - Kết quả từ Cloudinary
 */
export const uploadToCloudinary = (buffer, folder = 'dreamcourse') => {
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