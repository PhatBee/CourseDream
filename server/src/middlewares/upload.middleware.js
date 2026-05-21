import multer from 'multer';

// Lưu trữ file trong bộ nhớ (RAM) dưới dạng Buffer
const storage = multer.memoryStorage();

// ===== IMAGE FILTER (thumbnail, avatar, etc.) =====
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép upload file ảnh!'), false);
    }
};

// ===== DOCUMENT FILTER (PDF, Word, Excel, Zip, Text) =====
const fileFilterDocument = (req, file, cb) => {
    const allowedMimeTypes = [
        // Hỗ trợ upload all
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    cb(null, true);

    // if (allowedMimeTypes.includes(file.mimetype)) {
    //     cb(null, true);
    // } else {
    //     cb(new Error('Chỉ hỗ trợ file văn bản/tài liệu (PDF, Word, Excel, Zip, Txt)!'), false);
    // }
};

// ===== MULTER EXPORTS =====

// Dùng cho upload ảnh thumbnail (qua server -> Cloudinary)
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Dùng cho upload tài liệu resource lên S3 (thông qua server nếu cần)
export const uploadDocument = multer({
    storage,
    fileFilter: fileFilterDocument,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// NOTE: Video upload không qua server nữa.
// Video được upload TRỰC TIẾP từ Browser lên S3 qua Presigned URL.
// Backend chỉ cấp presigned URL, không cần xử lý file video.
