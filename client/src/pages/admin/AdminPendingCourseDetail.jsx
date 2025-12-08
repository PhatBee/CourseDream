import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    getAdminPendingDetail,
    adminApproveCourse,
    adminRejectCourse
} from '../../features/course/courseSlice';
import { ChevronDown, ChevronUp, Play, X, CheckCircle } from 'lucide-react';
import VideoPreviewModal from '../../components/common/VideoPreviewModal';
import { createPortal } from 'react-dom';

// Approve Confirmation Modal Component
const ApproveModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined}></div>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 animate-scaleIn text-center">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-500 w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận duyệt khóa học</h3>
                <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                    Bạn có chắc chắn muốn duyệt khóa học này? Khóa học sẽ được xuất bản và hiển thị công khai.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors min-w-[100px] disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 shadow-lg shadow-green-200 transition-all transform hover:scale-105 min-w-[140px] flex justify-center items-center disabled:transform-none disabled:opacity-70"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Xác nhận duyệt'}
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

// Reject Input Modal Component
const RejectModal = ({ isOpen, onClose, onConfirm, isLoading, rejectMessage, setRejectMessage }) => {
    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="absolute inset-0" onClick={!isLoading ? onClose : undefined}></div>

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 animate-scaleIn">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-gray-900 mb-4">Từ chối khóa học</h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Vui lòng nhập lý do từ chối để giảng viên có thể chỉnh sửa:
                </p>

                <textarea
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập lý do từ chối..."
                    disabled={isLoading}
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2.5 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading || !rejectMessage.trim()}
                        className="px-6 py-2.5 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 shadow-lg shadow-red-200 transition-all transform hover:scale-105 flex justify-center items-center min-w-[140px] disabled:transform-none disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Xác nhận từ chối'}
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

const AdminPendingCourseDetail = () => {
    const { revisionId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { adminPendingDetail, isLoading, adminActionLoading } = useSelector(
        (state) => state.course
    );

    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectMessage, setRejectMessage] = useState('');
    const [expandedSections, setExpandedSections] = useState([]);
    const [videoPreview, setVideoPreview] = useState(null);

    useEffect(() => {
        dispatch(getAdminPendingDetail(revisionId));
    }, [dispatch, revisionId]);

    const handleApprove = async () => {
        const result = await dispatch(adminApproveCourse(revisionId));
        if (result.type.endsWith('/fulfilled')) {
            setShowApproveModal(false);
            navigate('/admin/pending-courses');
        }
    };

    const handleReject = async () => {
        if (!rejectMessage.trim()) return;

        const result = await dispatch(adminRejectCourse({ revisionId, reviewMessage: rejectMessage }));
        if (result.type.endsWith('/fulfilled')) {
            setShowRejectModal(false);
            navigate('/admin/pending-courses');
        }
    };

    const toggleSection = (index) => {
        setExpandedSections(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleVideoPreview = (videoUrl) => {
        setVideoPreview(videoUrl);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!adminPendingDetail) return null;

    const { revision, originalCourse, type } = adminPendingDetail;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="bg-white rounded-lg shadow-md p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{revision.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Giảng viên: {revision.instructor?.name}
                            </span>
                            <span>Email: {revision.instructor?.email}</span>
                        </div>

                        <div className="mt-2">
                            {type === 'new' ? (
                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                    Khóa học mới
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                                    Cập nhật khóa học
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/admin/pending-courses')}
                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={() => setShowApproveModal(true)}
                            disabled={adminActionLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            Duyệt
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={adminActionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            Từ chối
                        </button>
                    </div>
                </div>

                {/* Thumbnail */}
                {revision.thumbnail && (
                    <div className="mb-6">
                        <img
                            src={revision.thumbnail}
                            alt={revision.title}
                            className="w-full max-h-96 object-cover rounded-lg"
                        />
                    </div>
                )}

                {/* Course Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Thông tin cơ bản</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Giá gốc:</strong> {revision.price?.toLocaleString('vi-VN')} VNĐ</p>
                            <p><strong>Giá khuyến mãi:</strong> {revision.priceDiscount?.toLocaleString('vi-VN')} VNĐ</p>
                            <p><strong>Cấp độ:</strong> {revision.level}</p>
                            <p><strong>Ngôn ngữ:</strong> {revision.language}</p>
                            <p><strong>Slug:</strong> {revision.slug}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-2">Danh mục</h3>
                        <div className="flex flex-wrap gap-2">
                            {revision.categories?.map((cat) => (
                                <span
                                    key={cat._id}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                >
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Descriptions */}
                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Mô tả ngắn</h3>
                    <p className="text-gray-700">{revision.shortDescription}</p>
                </div>

                <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">Mô tả chi tiết</h3>
                    <div
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: revision.description }}
                    />
                </div>

                {/* Learning Outcomes */}
                {revision.learnOutcomes?.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">Bạn sẽ học được gì?</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {revision.learnOutcomes.map((outcome, index) => (
                                <li key={index} className="text-gray-700">{outcome}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Requirements */}
                {revision.requirements?.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-2">Yêu cầu</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {revision.requirements.map((req, index) => (
                                <li key={index} className="text-gray-700">{req}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Curriculum with Expandable Sections */}
                {revision.sections?.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg mb-4">
                            Nội dung khóa học ({revision.sections.length} sections)
                        </h3>
                        <div className="space-y-2">
                            {revision.sections.map((section, sectionIndex) => (
                                <div key={sectionIndex} className="border rounded-lg overflow-hidden">
                                    {/* Section Header - Clickable */}
                                    <button
                                        onClick={() => toggleSection(sectionIndex)}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-semibold">
                                                Section {section.order}: {section.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {section.lectures?.length || 0} lectures
                                            </p>
                                        </div>
                                        {expandedSections.includes(sectionIndex) ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </button>

                                    {/* Section Content - Expandable */}
                                    {expandedSections.includes(sectionIndex) && section.lectures?.length > 0 && (
                                        <ul className="divide-y">
                                            {section.lectures.map((lecture, lectureIndex) => (
                                                <li key={lectureIndex} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Play className="w-4 h-4 text-gray-400" />
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium">{lecture.title}</span>
                                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                                <span>{Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}</span>
                                                                {lecture.isPreviewFree && (
                                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                                                                        Preview
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {lecture.videoUrl && (
                                                        <button
                                                            onClick={() => handleVideoPreview(lecture.videoUrl)}
                                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                        >
                                                            Xem video
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

                {/* So sánh với bản gốc (nếu là update) */}
                {type === 'update' && originalCourse && (
                    <div className="mb-6 border-t pt-6">
                        <h3 className="font-semibold text-lg mb-4 text-orange-600">
                            📋 Thông tin khóa học hiện tại (để so sánh)
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm"><strong>Tiêu đề cũ:</strong> {originalCourse.title}</p>
                            <p className="text-sm"><strong>Giá cũ:</strong> {originalCourse.price?.toLocaleString('vi-VN')} VNĐ</p>
                            <p className="text-sm"><strong>Version cũ:</strong> {originalCourse.version}</p>
                            <p className="text-sm"><strong>Số sections cũ:</strong> {originalCourse.sections?.length || 0}</p>
                        </div>
                    </div>
                )}
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
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectMessage('');
                }}
                onConfirm={handleReject}
                isLoading={adminActionLoading}
                rejectMessage={rejectMessage}
                setRejectMessage={setRejectMessage}
            />

            {/* Video Preview Modal */}
            {videoPreview && (
                <VideoPreviewModal
                    videoUrl={videoPreview}
                    onClose={() => setVideoPreview(null)}
                />
            )}
        </div>
    );
};

export default AdminPendingCourseDetail;
