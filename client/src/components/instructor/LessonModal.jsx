// src/components/instructor/LessonModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Link as LinkIcon, Upload, FileText, Video, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { courseApi } from '../../api/courseApi';
import QuizBuilder from './QuizBuilder';


// UploadProgress Component
const UploadProgress = ({ progress, label, isComplete }) => (
    <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{label}</span>
            <span>{isComplete ? '✓ Done' : `${progress}%`}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-300 ${isComplete ? 'bg-green-500' : 'bg-rose-500'}`}
                style={{ width: `${progress}%` }}
            />
        </div>
    </div>
);

const LessonModal = ({ isOpen, onClose, onSave, initialData, isEditing, courseSlug }) => {
    const [lesson, setLesson] = useState({
        title: '',
        videoUrl: '',
        videoFile: null,
        duration: 0,
        isPreviewFree: false,
        resources: [],
        quizzes: [],      // ── THÊM
    });
    const [activeTab, setActiveTab] = useState('info'); // 'info' | 'quiz'

    // Video upload state
    const [videoUploadState, setVideoUploadState] = useState({
        isUploading: false,
        progress: 0,
        isComplete: false,
        fileName: ''
    });

    // Resource state
    const [resourceType, setResourceType] = useState('link');
    const [tempResource, setTempResource] = useState({ title: '', url: '' });
    const [uploadFile, setUploadFile] = useState(null);
    const [resourceUploadState, setResourceUploadState] = useState({
        isUploading: false,
        progress: 0
    });

    const videoInputRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            let parsedResources = [];
            if (initialData.resources && Array.isArray(initialData.resources)) {
                parsedResources = initialData.resources
                    .map((resource) => {
                        try {
                            if (typeof resource === 'object' && resource !== null) return resource;
                            if (typeof resource === 'string') {
                                const cleaned = resource.replace(/\n/g, '').replace(/\s+/g, ' ').trim();
                                try { return JSON.parse(cleaned); } catch { return null; }
                            }
                            return null;
                        } catch { return null; }
                    })
                    .filter(Boolean);
            }
            setLesson({ ...initialData, videoFile: null, resources: parsedResources, quizzes: initialData.quizzes || [] });
        } else {
            setLesson({ title: '', videoUrl: '', videoFile: null, duration: 0, isPreviewFree: false, resources: [], quizzes: [] });
        }
        setTempResource({ title: '', url: '' });
        setUploadFile(null);
        setResourceType('link');
        setVideoUploadState({ isUploading: false, progress: 0, isComplete: false, fileName: '' });
    }, [initialData, isOpen]);

    // ======================== VIDEO UPLOAD (S3 Direct) ========================
    const handleVideoFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            toast.error('Vui lòng chọn file video!');
            return;
        }

        const toastId = toast.loading(`Đang upload video: ${file.name}...`);
        setVideoUploadState({ isUploading: true, progress: 0, isComplete: false, fileName: file.name });

        try {
            // 1. Lấy presigned URL
            const presignRes = await courseApi.getVideoPresignedUrl({
                fileName: file.name,
                fileType: file.type,
                courseSlug: courseSlug || 'temp',
                lectureTitle: lesson.title || 'lecture',
            });

            const { uploadUrl, cdnUrl } = presignRes.data.data;

            // 2. Upload trực tiếp lên S3
            await courseApi.uploadFileToS3(uploadUrl, file, (percent) => {
                setVideoUploadState(prev => ({ ...prev, progress: percent }));
            });

            // 3. Lưu CDN URL vào state
            setLesson(prev => ({ ...prev, videoUrl: cdnUrl }));
            setVideoUploadState(prev => ({ ...prev, isUploading: false, isComplete: true, progress: 100 }));

            toast.success('Video đã upload lên AWS S3!', { id: toastId });
        } catch (err) {
            console.error('[S3] Video upload failed:', err);
            toast.error('Upload video thất bại!', { id: toastId });
            setVideoUploadState({ isUploading: false, progress: 0, isComplete: false, fileName: '' });
        }
    };

    // ======================== RESOURCE UPLOAD ========================
    const handleAddResource = async () => {
        if (!tempResource.title) return toast.error('Vui lòng nhập tên resource');

        if (resourceType === 'upload') {
            if (!uploadFile) return toast.error('Vui lòng chọn file để upload');

            setResourceUploadState({ isUploading: true, progress: 0 });
            const toastId = toast.loading(`Đang upload: ${uploadFile.name}...`);

            try {
                const presignRes = await courseApi.getResourcePresignedUrl({
                    fileName: uploadFile.name,
                    fileType: uploadFile.type,
                    courseSlug: courseSlug || 'temp',
                    lectureTitle: lesson.title || 'lecture',
                });

                const { uploadUrl, cdnUrl, signedUrl } = presignRes.data.data;

                await courseApi.uploadFileToS3(uploadUrl, uploadFile, (percent) => {
                    setResourceUploadState(prev => ({ ...prev, progress: percent }));
                });

                setLesson(prev => ({
                    ...prev,
                    resources: [...prev.resources, { title: tempResource.title, url: signedUrl || cdnUrl, type: 'file' }]
                }));

                toast.success('Resource đã upload!', { id: toastId });
            } catch (err) {
                toast.error('Upload resource thất bại!', { id: toastId });
            } finally {
                setResourceUploadState({ isUploading: false, progress: 0 });
                setTempResource({ title: '', url: '' });
                setUploadFile(null);
            }
        } else {
            if (!tempResource.url) return toast.error('Vui lòng nhập URL resource');
            setLesson(prev => ({
                ...prev,
                resources: [...prev.resources, { title: tempResource.title, url: tempResource.url, type: 'link' }]
            }));
            setTempResource({ title: '', url: '' });
            toast.success('Đã thêm resource!');
        }
    };

    const removeResource = (index) => {
        setLesson(prev => ({ ...prev, resources: prev.resources.filter((_, i) => i !== index) }));
    };

    const handleSave = () => {
        if (!lesson.title.trim()) return toast.error('Vui lòng nhập tên bài học');
        if (videoUploadState.isUploading) return toast.error('Đang upload video, vui lòng đợi...');
        onSave(lesson);
    };

    if (!isOpen) return null;

    const isVideoLinked = lesson.videoUrl && lesson.videoUrl.includes('cloudfront.net');
    const isYoutubeUrl = lesson.videoUrl && (lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be'));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-rose-50 to-pink-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                            <Video size={18} className="text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {isEditing ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* ── Tab nav (Thông tin / Quiz) */}
                <div className="flex border-b border-gray-100 bg-white">
                    <button
                        className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${activeTab === 'info'
                            ? 'border-rose-500 text-rose-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        onClick={() => setActiveTab('info')}
                    >
                        Thông tin bài học
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-2 ${activeTab === 'quiz'
                            ? 'border-rose-500 text-rose-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        onClick={() => setActiveTab('quiz')}
                    >
                        <HelpCircle size={14} />
                        Câu hỏi ({lesson.quizzes?.length || 0})
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">

                    {/* ── Tab: Thông tin bài học ── */}
                    {activeTab === 'info' && (<>
                        {/* Lesson Title */}
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700 text-justify">
                                Tên bài học <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
                                placeholder="Ví dụ: Introduction to React Hooks"
                            />
                        </div>

                        {/* Video Upload - AWS S3 */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700 text-justify">
                                Video bài học
                            </label>

                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gray-50 hover:border-rose-300 transition-colors">
                                {/* Current video status */}
                                {lesson.videoUrl && !videoUploadState.isUploading && (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${isVideoLinked ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                                        <CheckCircle size={18} className={isVideoLinked ? 'text-green-500' : 'text-blue-500'} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700">
                                                {isVideoLinked ? '✅ Video đã upload' : '🔗 Video từ URL ngoài'}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{lesson.videoUrl}</p>
                                        </div>
                                        <button
                                            onClick={() => setLesson(prev => ({ ...prev, videoUrl: '' }))}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                {/* Upload progress */}
                                {videoUploadState.isUploading && (
                                    <div className="mb-3">
                                        <UploadProgress
                                            progress={videoUploadState.progress}
                                            label={`Uploading: ${videoUploadState.fileName}`}
                                            isComplete={videoUploadState.isComplete}
                                        />
                                    </div>
                                )}

                                {!lesson.videoUrl && !videoUploadState.isUploading && (
                                    <div className="text-center py-4">
                                        <Video size={32} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 mb-3">Chọn file video để upload</p>
                                    </div>
                                )}

                                {/* Upload buttons */}
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        disabled={videoUploadState.isUploading}
                                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Upload size={15} />
                                        {lesson.videoUrl && isVideoLinked ? 'Đổi video' : 'Chọn video'}
                                    </button>

                                    {/* Manual URL input */}
                                    {!lesson.videoUrl && (
                                        <div className="flex-1 flex gap-2 min-w-0">
                                            <input
                                                type="url"
                                                placeholder="Hoặc nhập URL video..."
                                                value={lesson.videoUrl}
                                                onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })}
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 min-w-0"
                                            />
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleVideoFileChange}
                                />

                                <p className="text-xs text-gray-400 mt-2">
                                    Hỗ trợ MP4, MOV, AVI • Tối đa 2GB
                                </p>
                            </div>
                        </div>

                        {/* Duration + Preview Free */}
                        <div className="flex gap-5">
                            <div className="flex-1">
                                <label className="block text-sm font-semibold mb-1.5 text-gray-700 text-justify">⏱ Thời lượng</label>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <input
                                            type="number" min="0" max="999"
                                            value={Math.floor((lesson.duration || 0) / 60)}
                                            onChange={(e) => {
                                                const m = parseInt(e.target.value) || 0;
                                                const s = (lesson.duration || 0) % 60;
                                                setLesson({ ...lesson, duration: m * 60 + s });
                                            }}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-center"
                                        />
                                        <span className="text-xs text-gray-400 mt-1 block text-center">Phút</span>
                                    </div>
                                    <span className="text-xl font-bold text-gray-300 pb-5">:</span>
                                    <div className="flex-1">
                                        <input
                                            type="number" min="0" max="59"
                                            value={(lesson.duration || 0) % 60}
                                            onChange={(e) => {
                                                const s = Math.min(parseInt(e.target.value) || 0, 59);
                                                const m = Math.floor((lesson.duration || 0) / 60);
                                                setLesson({ ...lesson, duration: m * 60 + s });
                                            }}
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-center"
                                        />
                                        <span className="text-xs text-gray-400 mt-1 block text-center">Giây</span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1 text-center">
                                    Tổng: {Math.floor((lesson.duration || 0) / 60)}:{String((lesson.duration || 0) % 60).padStart(2, '0')}
                                </p>
                            </div>

                            <div className="flex-1 flex items-center pt-5">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            id="isPreviewFree"
                                            checked={lesson.isPreviewFree}
                                            onChange={(e) => setLesson({ ...lesson, isPreviewFree: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`w-11 h-6 rounded-full transition-colors ${lesson.isPreviewFree ? 'bg-rose-500' : 'bg-gray-200'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${lesson.isPreviewFree ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'}`} />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-700">Xem miễn phí</span>
                                        <p className="text-xs text-gray-400">Cho phép preview</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Resources */}
                        <div className="border-t pt-5">
                            <label className="block text-sm font-semibold mb-3 text-gray-700 text-justify">📎 Tài liệu đính kèm</label>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {/* Tab Switcher */}
                                <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit">
                                    <button
                                        onClick={() => setResourceType('link')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${resourceType === 'link' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        🔗 Liên kết ngoài
                                    </button>
                                    <button
                                        onClick={() => setResourceType('upload')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${resourceType === 'upload' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        ☁️ Tải lên
                                    </button>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Tên tài liệu (Ví dụ: Exercise PDF)"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                            value={tempResource.title}
                                            onChange={(e) => setTempResource({ ...tempResource, title: e.target.value })}
                                        />

                                        {resourceType === 'link' ? (
                                            <input
                                                type="url"
                                                placeholder="URL (https://drive.google.com/...)"
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                                value={tempResource.url}
                                                onChange={(e) => setTempResource({ ...tempResource, url: e.target.value })}
                                            />
                                        ) : (
                                            <div>
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                                                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100"
                                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                                />
                                                {resourceUploadState.isUploading && (
                                                    <UploadProgress
                                                        progress={resourceUploadState.progress}
                                                        label="Uploading resource..."
                                                        isComplete={resourceUploadState.progress === 100}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleAddResource}
                                        disabled={resourceUploadState.isUploading}
                                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium h-10 transition-colors disabled:opacity-50"
                                    >
                                        Thêm
                                    </button>
                                </div>

                                {/* Resource List */}
                                {lesson.resources.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {lesson.resources.filter(r => r && r.title).map((res, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm hover:shadow transition-shadow">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${res?.type === 'file' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {res?.type === 'file' ? <FileText size={14} /> : <LinkIcon size={14} />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-gray-700 truncate">{res.title}</span>
                                                        <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                                            {res?.url ? (
                                                                <a href={res.url} target="_blank" rel="noreferrer" className="hover:text-rose-500">
                                                                    {res.url.includes('cloudfront.net') ? '☁️ AWS S3' : res.url}
                                                                </a>
                                                            ) : 'No URL'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeResource(idx)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>)} {/* end activeTab === 'info' */}

                    {/* ── Tab: Quiz ──────────────────────────────────────────────────── */}
                    {activeTab === 'quiz' && (
                        <QuizBuilder
                            quizzes={lesson.quizzes || []}
                            onChange={(newQuizzes) => setLesson(prev => ({ ...prev, quizzes: newQuizzes }))}
                        />
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                        {lesson.videoUrl
                            ? (isVideoLinked ? '✅ Video sẵn sàng từ AWS CloudFront' : '🔗 Video từ URL ngoài')
                            : '⚠️ Chưa có video'}
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition-colors text-sm">
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={videoUploadState.isUploading || resourceUploadState.isUploading}
                            className="px-6 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEditing ? 'Lưu thay đổi' : 'Thêm bài học'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonModal;