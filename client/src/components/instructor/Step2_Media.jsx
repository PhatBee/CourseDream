// src/components/instructor/Step2_Media.jsx
import React, { useRef, useState } from 'react';
import { X, Image as ImageIcon, Upload, Video, CheckCircle, Cloud, AlertCircle } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import { toast } from 'react-hot-toast';

// UploadProgress Component
const UploadProgressBar = ({ progress, label }) => (
    <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span className="truncate">{label}</span>
            <span className="ml-2 flex-shrink-0">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
);

const Step2_Media = ({ courseData, setCourseData, courseSlug, errorFields = {} }) => {
    const [thumbUploading, setThumbUploading] = useState(false);
    const [thumbProgress, setThumbProgress] = useState(0);
    const [previewUploading, setPreviewUploading] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const previewRef = useRef(null);

    // ======================== THUMBNAIL UPLOAD (S3) ========================
    const handleThumbnailChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh!');
            return;
        }

        // Preview local trước khi upload
        const reader = new FileReader();
        reader.onloadend = () => {
            setCourseData(p => ({ ...p, thumbnailPreview: reader.result }));
        };
        reader.readAsDataURL(file);

        setThumbUploading(true);
        setThumbProgress(0);
        const toastId = toast.loading('Đang upload thumbnail lên AWS S3...');

        try {
            const presignRes = await courseApi.getThumbnailPresignedUrl({
                fileName: file.name,
                fileType: file.type,
                courseSlug: courseSlug || courseData.slug || 'temp',
            });

            const { uploadUrl, cdnUrl } = presignRes.data.data;

            await courseApi.uploadFileToS3(uploadUrl, file, (pct) => {
                setThumbProgress(pct);
            });

            // Lưu CDN URL vào courseData
            setCourseData(p => ({
                ...p,
                thumbnail: cdnUrl,       // CDN URL (dùng khi save)
                thumbnailUrl: cdnUrl,    // Alias dùng cho backend
                thumbnailPreview: cdnUrl // Preview URL
            }));

            toast.success('Thumbnail đã upload lên AWS CloudFront!', { id: toastId });
        } catch (err) {
            console.error('[S3] Thumbnail upload error:', err);
            toast.error('Upload thumbnail thất bại!', { id: toastId });
        } finally {
            setThumbUploading(false);
            setThumbProgress(0);
        }
    };

    // ======================== PREVIEW VIDEO UPLOAD (S3) ========================
    const handlePreviewVideoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Vui lòng chọn file video!');
            return;
        }

        setPreviewUploading(true);
        setPreviewProgress(0);
        const toastId = toast.loading(`Đang upload preview video: ${file.name}...`);

        try {
            const presignRes = await courseApi.getPreviewPresignedUrl({
                fileName: file.name,
                fileType: file.type,
                courseSlug: courseSlug || courseData.slug || 'temp',
            });

            const { uploadUrl, cdnUrl } = presignRes.data.data;

            await courseApi.uploadFileToS3(uploadUrl, file, (pct) => {
                setPreviewProgress(pct);
            });

            setCourseData(p => ({ ...p, previewUrl: cdnUrl, previewVideoUrl: cdnUrl }));
            toast.success('Preview video đã upload lên AWS CloudFront!', { id: toastId });
        } catch (err) {
            console.error('[S3] Preview upload error:', err);
            toast.error('Upload preview video thất bại!', { id: toastId });
        } finally {
            setPreviewUploading(false);
            setPreviewProgress(0);
        }
    };

    const isPreviewS3 = courseData.previewUrl && courseData.previewUrl.includes('cloudfront.net');
    const isThumbnailS3 = (courseData.thumbnail || courseData.thumbnailPreview || '')
        .includes('cloudfront.net');

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">🎨 Course Media</h2>
                <p className="text-gray-500 text-sm mt-1">Thumbnail và video preview cho khóa học của bạn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* ===== THUMBNAIL ===== */}
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">
                        🖼️ Course Thumbnail <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-3">Tỷ lệ 16:9 khuyến nghị, tối thiểu 750x422px</p>

                    {/* Thumbnail upload zone */}
                    <div
                        className={`border-2 border-dashed rounded-2xl h-56 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden group hover:border-rose-300 transition-all cursor-pointer ${errorFields.thumbnail
                            ? 'border-red-400 bg-red-50/30 ring-2 ring-red-300'
                            : 'border-gray-200'
                            }`}
                    >

                        {/* Preview */}
                        {(courseData.thumbnailPreview || courseData.thumbnail) && !thumbUploading ? (
                            <>
                                <img
                                    src={courseData.thumbnailPreview || courseData.thumbnail}
                                    alt="Thumbnail preview"
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">Nhấn để đổi ảnh</span>
                                </div>
                                {/* S3 badge
                                {isThumbnailS3 && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Cloud size={10} /> AWS S3
                                    </div>
                                )} */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCourseData(p => ({ ...p, thumbnail: null, thumbnailUrl: '', thumbnailPreview: '' }));
                                    }}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        ) : thumbUploading ? (
                            <div className="w-full px-6">
                                <div className="text-center mb-3">
                                    <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">Đang upload...</p>
                                </div>
                                <UploadProgressBar progress={thumbProgress} label="Uploading thumbnail..." />
                            </div>
                        ) : (
                            <>
                                <ImageIcon size={40} className="text-gray-300 mb-2" />
                                <p className="text-sm font-medium text-gray-500">Click để chọn ảnh</p>
                                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP • Tải lên</p>
                            </>
                        )}

                        <input type="file" accept="image/*" onChange={handleThumbnailChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                </div>

                {/* Error message cho thumbnail */}
                {errorFields.thumbnail && !courseData.thumbnailPreview && !courseData.thumbnail && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-red-500 font-medium animate-fadeIn">
                        <AlertCircle size={12} className="flex-shrink-0" /> {errorFields.thumbnail}
                    </p>
                )}

                {/* ===== PREVIEW VIDEO ===== */}
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700">
                        🎬 Course Intro Video <span className="text-gray-400 font-normal">(Không bắt buộc)</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-3">Video giới thiệu ngắn về khóa học</p>

                    <div className="border-2 border-dashed border-gray-200 rounded-2xl h-56 flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden hover:border-rose-300 transition-all">

                        {/* Currently uploaded S3 Preview */}
                        {(courseData.previewUrl || courseData.previewVideoUrl) && !previewUploading ? (
                            <div className="w-full h-full relative">
                                <video
                                    src={courseData.previewUrl || courseData.previewVideoUrl}
                                    className="w-full h-full object-cover"
                                    controls={false}
                                    muted
                                />
                                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                    {/* {isPreviewS3 && (
                                        <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 mb-3">
                                            <Cloud size={10} /> AWS CloudFront
                                        </div>
                                    )} */}
                                    <CheckCircle size={32} className="text-white mb-2" />
                                    <p className="text-white text-sm font-semibold">Preview video đã sẵn sàng</p>
                                    <button
                                        onClick={() => { previewRef.current?.click(); }}
                                        className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors border border-white/30"
                                    >
                                        Đổi video
                                    </button>
                                </div>
                            </div>
                        ) : previewUploading ? (
                            <div className="w-full px-6">
                                <div className="text-center mb-3">
                                    <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">Đang upload Preview Video...</p>
                                </div>
                                <UploadProgressBar progress={previewProgress} label="Uploading..." />
                            </div>
                        ) : (
                            <div className="text-center px-4">
                                <Video size={40} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-gray-500 mb-1">Upload video giới thiệu</p>
                                <p className="text-xs text-gray-400 mb-4">MP4, MOV, AVI</p>

                                <div className="flex gap-2 justify-center flex-wrap">
                                    <button
                                        onClick={() => previewRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium transition-colors"
                                    >
                                        <Upload size={14} /> Upload
                                    </button>
                                </div>

                                {/* Manual URL option
                                <div className="mt-3">
                                    <input
                                        type="url"
                                        placeholder="Hoặc nhập URL video..."
                                        value={courseData.previewUrl || courseData.previewVideoUrl || ''}
                                        onChange={(e) => setCourseData(p => ({ ...p, previewUrl: e.target.value, previewVideoUrl: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    />
                                </div> */}
                            </div>
                        )}

                        <input
                            ref={previewRef}
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handlePreviewVideoChange}
                        />
                    </div>
                </div>
            </div>

            {/* AWS Info Banner
            <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Cloud size={16} className="text-blue-600" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-blue-800">☁️ AWS CloudFront CDN</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        Media được lưu trữ trên Amazon S3 và phân phối qua CloudFront CDN toàn cầu — đảm bảo tốc độ tải nhanh nhất và bảo mật cao.
                    </p>
                </div>
            </div> */}
        </div>
    );
};

export default Step2_Media;