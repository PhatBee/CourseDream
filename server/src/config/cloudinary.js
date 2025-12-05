import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import slugify from 'slugify';
import path from 'path';


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

/**
 * Upload Resource lên Cloudinary
 */

export const uploadResourceToCloudinary = (file, title) => {
    return new Promise((resolve, reject) => {
        const fileExt = file.originalname ? path.extname(file.originalname) : '';
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'dreamcourse/resources',
                resource_type: 'raw', // Quan trọng cho file docs/zip
                public_id: `${slugify(title, { lower: true })}-${Date.now()}${fileExt}`,
                use_filename: true
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    originalName: title,
                    format: result.format || (file.mimetype ? file.mimetype.split('/')[1] : null)
                });
            }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
};