// src/components/admin/ApplicationDetailModal.jsx
import React, { useState } from 'react';
import { X, CheckCircle, XCircle, User, Video, FileText } from 'lucide-react';

const ApplicationDetailModal = ({ isOpen, onClose, application, onReview, isProcessing }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    if (!isOpen || !application) return null;

    const handleApprove = () => {
        onReview(application._id, 'approve');
    };

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        onReview(application._id, 'reject', rejectReason);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Duyệt Đơn Đăng Ký</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* User Info Card */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <img 
                            src={application.user?.avatar || "/default-user.png"} 
                            alt="Avatar" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div>
                            <h4 className="text-lg font-bold text-gray-900">{application.user?.name}</h4>
                            <p className="text-gray-600 text-sm">{application.user?.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded uppercase">
                                {application.status}
                            </span>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <User size={18} className="text-blue-500" /> Giới thiệu bản thân
                        </h5>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border whitespace-pre-line">
                            {application.bio}
                        </div>
                    </div>

                    {/* Experience */}
                    <div>
                        <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                            <FileText size={18} className="text-green-500" /> Kinh nghiệm & Chứng chỉ
                        </h5>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border whitespace-pre-line">
                            {application.experience}
                        </div>
                    </div>

                    {/* Topics */}
                    <div>
                        <h5 className="font-bold text-gray-800 mb-2">Chủ đề giảng dạy dự kiến</h5>
                        <div className="flex flex-wrap gap-2">
                            {application.intendedTopics?.map((topic, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border">
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Video */}
                    {application.sampleVideoUrl && (
                        <div>
                            <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <Video size={18} className="text-red-500" /> Video giới thiệu
                            </h5>
                            <a 
                                href={application.sampleVideoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm break-all bg-gray-50 p-2 rounded block border"
                            >
                                {application.sampleVideoUrl}
                            </a>
                        </div>
                    )}

                    {/* Reject Input Area */}
                    {showRejectInput && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 animate-fadeIn">
                            <label className="block text-sm font-bold text-red-700 mb-1">Lý do từ chối *</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-2 border border-red-200 rounded focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                                rows="3"
                                placeholder="Nhập lý do để gửi email thông báo cho học viên..."
                            ></textarea>
                            <div className="flex justify-end gap-2 mt-2">
                                <button 
                                    onClick={() => setShowRejectInput(false)}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleReject}
                                    disabled={!rejectReason.trim() || isProcessing}
                                    className="px-4 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isProcessing ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {!showRejectInput && application.status === 'pending' && (
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button 
                            onClick={() => setShowRejectInput(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition"
                        >
                            <XCircle size={18} /> Từ chối
                        </button>
                        <button 
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-sm transition disabled:opacity-70"
                        >
                            {isProcessing ? 'Đang xử lý...' : <><CheckCircle size={18} /> Duyệt Giảng Viên</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicationDetailModal;