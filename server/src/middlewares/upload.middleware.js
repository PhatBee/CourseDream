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

// Kiểm tra định dạng file video
const fileFilterVideo = (req, file, cb) => {
    if (file.mimetype.startsWith('video')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép upload file video!'), false);
    }
};

// Filter Document (PDF, Word, Text, Zip...)
const fileFilterDocument = (req, file, cb) => {
    // Danh sách các mime type cho phép ( có thể mở rộng thêm)
    const allowedMimeTypes = [
        'application/pdf', // .pdf
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'text/plain', // .txt
        'application/zip', // .zip
        'application/x-zip-compressed',
        'application/vnd.ms-powerpoint', // .ppt
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ hỗ trợ file văn bản/tài liệu (PDF, Word, Excel, Zip, Txt)!'), false);
    }
};

export const uploadVideo = multer({
    storage,
    fileFilterVideo,
    limits: { fileSize: 500 * 1024 * 1024 }, // Giới hạn 500MB
})

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
});

export const uploadDocument = multer({
    storage,
    fileFilterDocument,
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
});