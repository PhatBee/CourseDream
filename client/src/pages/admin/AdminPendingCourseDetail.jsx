// src/pages/admin/AdminPendingCourseDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    getAdminPendingDetail,
    adminApproveCourse,
    adminRejectCourse
} from '../../features/admin/adminSlice';
import {
    ChevronDown, ChevronUp, Play, X, CheckCircle, ArrowLeft,
    User, Tag, DollarSign, Globe, Layers, Clock, Video,
    BookOpen, Award, List, Cloud
} from 'lucide-react';
import { createPortal } from 'react-dom';

// ======================== MODAL COMPONENTS ========================

const ApproveModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative z-10 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận duyệt</h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Khóa học sẽ được xuất bản ngay lập tức và hiển thị trên marketplace.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '✅ Duyệt ngay'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const RejectModal = ({ isOpen, onClose, onConfirm, isLoading, rejectMessage, setRejectMessage }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10">
                <button onClick={onClose} disabled={isLoading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Từ chối khóa học</h3>
                <p className="text-gray-500 text-sm mb-4">Nhập lý do để giảng viên có thể chỉnh sửa và nộp lại:</p>
                <textarea
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 mb-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none"
                    placeholder="Ví dụ: Nội dung chưa đầy đủ, cần bổ sung bài học về XYZ..."
                    disabled={isLoading}
                />
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50">
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading || !rejectMessage.trim()}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : '❌ Từ chối'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// ======================== CLOUDFRONT VIDEO PLAYER ========================
const CloudFrontVideoPlayer = ({ url, onClose }) => {
    const isCloudFront = url?.includes('cloudfront.net');
    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 w-full max-w-4xl">
                <button onClick={onClose} className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm">
                    <X size={18} /> Đóng
                </button>
                {isCloudFront ? (
                    <video
                        src={url}
                        controls
                        autoPlay
                        className="w-full rounded-2xl shadow-2xl max-h-[80vh]"
                    />
                ) : (
                    <iframe
                        src={url.replace('watch?v=', 'embed/')}
                        className="w-full aspect-video rounded-2xl shadow-2xl"
                        allowFullScreen
                        title="Video preview"
                    />
                )}
                {isCloudFront && (
                    <div className="flex items-center gap-2 mt-3 justify-center">
                        <Cloud size={14} className="text-blue-400" />
                        <span className="text-white/60 text-xs">Phát từ AWS CloudFront CDN</span>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

// Info Item Component
const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon size={15} className="text-rose-500" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || 'N/A'}</p>
        </div>
    </div>
);

// ======================== MAIN COMPONENT ========================
const AdminPendingCourseDetail = () => {
    const { revisionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { adminPendingDetail, isLoading, adminActionLoading } = useSelector(state => state.admin);

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectMessage, setRejectMessage] = useState('');
    const [expandedSections, setExpandedSections] = useState([0]); // Auto expand first
    const [videoPreview, setVideoPreview] = useState(null);

    useEffect(() => {
        dispatch(getAdminPendingDetail(revisionId));
    }, [dispatch, revisionId]);

    const handleApprove = async () => {
        const result = await dispatch(adminApproveCourse(revisionId));
        if (result.type.endsWith('/fulfilled')) {
            setShowApproveModal(false);
            navigate('/admin/courses');
        }
    };

    const handleReject = async () => {
        if (!rejectMessage.trim()) return;
        const result = await dispatch(adminRejectCourse({ revisionId, reviewMessage: rejectMessage }));
        if (result.type.endsWith('/fulfilled')) {
            setShowRejectModal(false);
            navigate('/admin/courses');
        }
    };

    const toggleSection = (idx) => {
        setExpandedSections(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
                <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
            </div>
        );
    }

    if (!adminPendingDetail) return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-400">Không tìm thấy dữ liệu</p>
        </div>
    );

    const { revision, originalCourse, type } = adminPendingDetail;

    const formatVND = (num) => (num || 0).toLocaleString('vi-VN') + '₫';
    const isVideoS3 = (url) => url && url.includes('cloudfront.net');

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Top Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/courses')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft size={18} /> Quay lại
                        </button>
                        <div className="w-px h-5 bg-gray-200" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-gray-900 text-lg line-clamp-1 max-w-md">{revision.title}</h1>
                                {type === 'new' ? (
                                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">Mới</span>
                                ) : (
                                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">Cập nhật</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Giảng viên: <span className="font-medium text-gray-600">{revision.instructor?.name}</span> • {revision.instructor?.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowApproveModal(true)}
                            disabled={adminActionLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200 disabled:opacity-50"
                        >
                            <CheckCircle size={16} /> Duyệt
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={adminActionLoading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 disabled:opacity-50"
                        >
                            <X size={16} /> Từ chối
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ===== LEFT COLUMN: Main Content ===== */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Thumbnail */}
                        {revision.thumbnail && (
                            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                                <img
                                    src={revision.thumbnail}
                                    alt={revision.title}
                                    className="w-full aspect-video object-cover"
                                />
                                {revision.thumbnail.includes('cloudfront.net') && (
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                                        <Cloud size={11} /> AWS CloudFront
                                    </div>
                                )}
                                {(revision.previewUrl) && (
                                    <button
                                        onClick={() => setVideoPreview(revision.previewUrl)}
                                        className="absolute inset-0 flex items-center justify-center group"
                                    >
                                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Play size={24} className="text-rose-600 ml-1" />
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Descriptions */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <BookOpen size={18} className="text-rose-500" /> Mô tả khóa học
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">{revision.shortDescription}</p>
                            {revision.description && (
                                <div
                                    className="prose prose-sm max-w-none text-gray-600"
                                    dangerouslySetInnerHTML={{ __html: revision.description }}
                                />
                            )}
                        </div>

                        {/* Learn Outcomes */}
                        {revision.learnOutcomes?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Award size={18} className="text-rose-500" /> Học viên sẽ học được
                                </h2>
                                <ul className="space-y-2">
                                    {revision.learnOutcomes.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Requirements */}
                        {revision.requirements?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <List size={18} className="text-rose-500" /> Yêu cầu trước khi học
                                </h2>
                                <ul className="space-y-2">
                                    {revision.requirements.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                                            <span className="text-gray-700">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Curriculum */}
                        {revision.sections?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Layers size={18} className="text-rose-500" /> Nội dung khóa học
                                    <span className="text-sm font-normal text-gray-400">
                                        ({revision.sections.length} sections •{' '}
                                        {revision.sections.reduce((acc, s) => acc + (s.lectures?.length || 0), 0)} bài học)
                                    </span>
                                </h2>

                                <div className="space-y-3">
                                    {revision.sections.map((section, sIdx) => (
                                        <div key={sIdx} className="border border-gray-100 rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => toggleSection(sIdx)}
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-xs font-bold text-rose-600">
                                                        {sIdx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-sm">{section.title}</h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">{section.lectures?.length || 0} bài học</p>
                                                    </div>
                                                </div>
                                                {expandedSections.includes(sIdx)
                                                    ? <ChevronUp size={18} className="text-gray-400" />
                                                    : <ChevronDown size={18} className="text-gray-400" />}
                                            </button>

                                            {expandedSections.includes(sIdx) && section.lectures?.length > 0 && (
                                                <ul className="divide-y divide-gray-50">
                                                    {section.lectures.map((lecture, lIdx) => (
                                                        <li key={lIdx} className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                                    <Play size={11} className="text-gray-400" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-gray-800 truncate font-medium">{lecture.title}</p>
                                                                    <div className="flex items-center gap-3 mt-0.5">
                                                                        <span className="text-xs text-gray-400">
                                                                            {Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}
                                                                        </span>
                                                                        {lecture.isPreviewFree && (
                                                                            <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-xs rounded font-medium">Preview</span>
                                                                        )}
                                                                        {lecture.videoUrl && isVideoS3(lecture.videoUrl) && (
                                                                            <span className="flex items-center gap-1 text-xs text-blue-500">
                                                                                <Cloud size={10} /> S3
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {lecture.videoUrl && (
                                                                <button
                                                                    onClick={() => setVideoPreview(lecture.videoUrl)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex-shrink-0 ml-2"
                                                                >
                                                                    <Video size={12} /> Xem video
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Compare with original (Update mode) */}
                        {type === 'update' && originalCourse && (
                            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
                                <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                                    📋 So sánh với khóa học hiện tại
                                </h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-amber-600 font-semibold mb-1">HIỆN TẠI</p>
                                        <p className="text-amber-900"><strong>Tiêu đề:</strong> {originalCourse.title}</p>
                                        <p className="text-amber-900"><strong>Giá:</strong> {formatVND(originalCourse.price)}</p>
                                        <p className="text-amber-900"><strong>Phiên bản:</strong> v{originalCourse.version}</p>
                                        <p className="text-amber-900"><strong>Sections:</strong> {originalCourse.sections?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-rose-600 font-semibold mb-1">PHIÊN BẢN MỚI</p>
                                        <p className="text-rose-900"><strong>Tiêu đề:</strong> {revision.title}</p>
                                        <p className="text-rose-900"><strong>Giá:</strong> {formatVND(revision.price)}</p>
                                        <p className="text-rose-900"><strong>Sections:</strong> {revision.sections?.length || 0}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ===== RIGHT COLUMN: Sidebar ===== */}
                    <div className="space-y-5">

                        {/* Course Info Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Thông tin khóa học</h3>
                            <div className="space-y-3">
                                <InfoItem icon={DollarSign} label="Giá gốc" value={formatVND(revision.price)} />
                                <InfoItem icon={DollarSign} label="Giá khuyến mãi" value={formatVND(revision.priceDiscount)} />
                                <InfoItem icon={Award} label="Cấp độ" value={revision.level} />
                                <InfoItem icon={Globe} label="Ngôn ngữ" value={revision.language} />
                                <InfoItem icon={Tag} label="Slug" value={revision.slug} />
                            </div>
                        </div>

                        {/* Instructor Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Giảng viên</h3>
                            <div className="flex items-center gap-3">
                                <img
                                    src={revision.instructor?.avatar || `https://ui-avatars.com/api/?name=${revision.instructor?.name}`}
                                    alt={revision.instructor?.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-gray-100"
                                />
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{revision.instructor?.name}</p>
                                    <p className="text-xs text-gray-400">{revision.instructor?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        {revision.categories?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Danh mục</h3>
                                <div className="flex flex-wrap gap-2">
                                    {revision.categories.map((cat) => (
                                        <span key={cat._id} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
                                            {cat.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions (Mobile) */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                            <button
                                onClick={() => setShowApproveModal(true)}
                                disabled={adminActionLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle size={18} /> Duyệt khóa học
                            </button>
                            <button
                                onClick={() => setShowRejectModal(true)}
                                disabled={adminActionLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                                <X size={18} /> Từ chối
                            </button>
                            <button
                                onClick={() => navigate('/admin/courses')}
                                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ApproveModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                onConfirm={handleApprove}
                isLoading={adminActionLoading}
            />
            <RejectModal
                isOpen={showRejectModal}
                onClose={() => { setShowRejectModal(false); setRejectMessage(''); }}
                onConfirm={handleReject}
                isLoading={adminActionLoading}
                rejectMessage={rejectMessage}
                setRejectMessage={setRejectMessage}
            />

            {/* Video Preview */}
            {videoPreview && (
                <CloudFrontVideoPlayer
                    url={videoPreview}
                    onClose={() => setVideoPreview(null)}
                />
            )}
        </div>
    );
};

export default AdminPendingCourseDetail;
