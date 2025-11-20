import multer from 'multer';

// Lưu trữ file trong bộ nhớ (RAM) dưới dạng Buffer để upload thẳng lên Cloudinary
const storage = multer.memoryStorage();

// Kiểm tra định dạng file
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép upload file ảnh!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
});

export default upload;