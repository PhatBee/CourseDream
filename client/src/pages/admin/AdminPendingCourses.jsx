// src/pages/admin/AdminPendingCourses.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAdminPendingCourses } from '../../features/admin/adminSlice';
import Pagination from '../../components/common/Pagination';
import { Clock, User, BookOpen, ChevronRight, AlertCircle, CheckCircle, LayoutGrid } from 'lucide-react';

const StatusBadge = ({ type }) => {
    if (type === 'new') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Khóa học mới
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Cập nhật
        </span>
    );
};

const AdminPendingCourses = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { adminPendingCourses, adminPendingPagination, isLoading } = useSelector(state => state.admin);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(getAdminPendingCourses({ page: currentPage, limit: 10 }));
    }, [dispatch, currentPage]);

    const handleViewDetail = (revisionId) => navigate(`/admin/pending-courses/${revisionId}`);

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading && currentPage === 1) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Đang tải danh sách...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Khóa học chờ duyệt</h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {adminPendingPagination?.total || 0} khóa học đang chờ kiểm duyệt
                            </p>
                        </div>
                    </div>

                    {/* Stats pill */}
                    {adminPendingCourses?.length > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full">
                            <AlertCircle size={14} className="text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">
                                {adminPendingPagination?.total || adminPendingCourses.length} chưa duyệt
                            </span>
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {(!adminPendingCourses || adminPendingCourses.length === 0) ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={28} className="text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Tất cả đã được duyệt!</h3>
                        <p className="text-gray-400 text-sm">Không có khóa học nào đang chờ kiểm duyệt.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {adminPendingCourses.map((course) => (
                            <div
                                key={course._id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-200 cursor-pointer group"
                                onClick={() => handleViewDetail(course._id)}
                            >
                                <div className="flex items-start gap-5 p-5">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 w-36 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookOpen size={28} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <StatusBadge type={course.type} />
                                                    {course.courseName && (
                                                        <span className="text-xs text-gray-400 italic truncate">
                                                            Từ: "{course.courseName}"
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                                                    {course.title}
                                                </h3>
                                                <div className="flex items-center gap-5 text-xs text-gray-400 flex-wrap">
                                                    <span className="flex items-center gap-1.5">
                                                        <User size={13} className="text-gray-300" />
                                                        <span className="font-medium text-gray-600">{course.instructor?.name || 'N/A'}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={13} className="text-gray-300" />
                                                        {formatDate(course.submittedAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-sm font-semibold shadow-sm flex-shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetail(course._id);
                                                }}
                                            >
                                                Xem chi tiết
                                                <ChevronRight size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {adminPendingPagination?.totalPages > 1 && (
                    <div className="mt-8">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={adminPendingPagination.totalPages}
                            onPageChange={(p) => { setCurrentPage(p); window.scrollTo(0, 0); }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPendingCourses;
