// src/pages/admin/AdminPendingCourses.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAdminPendingCourses } from '../../features/admin/adminSlice';
import Pagination from '../../components/common/Pagination';
import {
    Clock, User, BookOpen, ChevronRight, CheckCircle,
    AlertTriangle, Clock3, Layers, Search
} from 'lucide-react';

// ======================== HELPERS ========================
const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const TypeBadge = ({ type }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
        type === 'new'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${type === 'new' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {type === 'new' ? 'Khóa học mới' : 'Cập nhật'}
    </span>
);

const RevStatusBadge = ({ status }) => {
    if (status === 'changes_requested') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
            <AlertTriangle size={10} /> Cần sửa
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock3 size={10} /> Chờ duyệt
        </span>
    );
};

// ======================== COURSE ROW ========================
const CourseRow = ({ course, onView }) => (
    <div
        onClick={() => onView(course._id)}
        className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden ${
            course.revisionStatus === 'changes_requested'
                ? 'border-orange-200 hover:border-orange-300'
                : 'border-gray-100 hover:border-rose-200'
        }`}
    >
        {/* Changes Requested Banner */}
        {course.revisionStatus === 'changes_requested' && (
            <div className="bg-orange-500 text-white text-xs font-bold px-4 py-1.5 flex items-center gap-2">
                <AlertTriangle size={12} /> Instructor đã sửa và gửi lại sau yêu cầu trước
            </div>
        )}

        <div className="flex items-start gap-4 p-4 sm:p-5">
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-28 h-18 sm:w-36 sm:h-24 bg-gray-100 rounded-xl overflow-hidden">
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-gray-100">
                        <BookOpen size={24} className="text-gray-300" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-justify">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <TypeBadge type={course.type} />
                    <RevStatusBadge status={course.revisionStatus} />
                    {course.version > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            v{course.version}
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {course.title}
                </h3>

                {course.courseName && (
                    <p className="text-xs text-gray-400 italic mb-1">
                        Từ khóa học: "{course.courseName}"
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-300" />
                        <span className="font-medium text-gray-600">{course.instructor?.name || 'N/A'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-300" />
                        {formatDate(course.submittedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Layers size={12} className="text-gray-300" />
                        {course.sectionsCount || 0} ch. · {course.lecturesCount || 0} bài
                    </span>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={e => { e.stopPropagation(); onView(course._id); }}
                className="flex-shrink-0 hidden sm:flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-xs font-bold shadow-sm self-center"
            >
                Xét duyệt <ChevronRight size={14} />
            </button>
        </div>
    </div>
);

// ======================== MAIN COMPONENT ========================
const AdminPendingCourses = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { adminPendingCourses, adminPendingPagination, adminPendingStats, isLoading } = useSelector(s => s.admin);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState(''); // '' = all pending+changes

    useEffect(() => {
        dispatch(getAdminPendingCourses({ page: currentPage, limit: 10, status: statusFilter }));
    }, [dispatch, currentPage, statusFilter]);

    const total = adminPendingPagination?.total || 0;
    const pendingCount = adminPendingStats?.pending || 0;
    const changesCount = adminPendingStats?.changes_requested || 0;

    const TABS = [
        { key: '', label: 'Tất cả cần duyệt', count: pendingCount + changesCount },
        { key: 'pending', label: 'Chờ duyệt', count: pendingCount },
        { key: 'changes_requested', label: 'Đã sửa & gửi lại', count: changesCount },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Kiểm duyệt khóa học</h1>
                        <p className="text-sm text-gray-400 mt-0.5 text-justify">
                            {total} khóa học đang chờ xem xét
                        </p>
                    </div>

                    {/* Alert badges */}
                    <div className="flex gap-2">
                        {pendingCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                <Clock3 size={12} /> {pendingCount} chờ duyệt
                            </div>
                        )}
                        {changesCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                <AlertTriangle size={12} /> {changesCount} đã sửa
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
                    <div className="flex">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                                className={`flex-1 px-4 py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
                                    statusFilter === tab.key
                                        ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                        statusFilter === tab.key ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                                    }`}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Đang tải...</p>
                    </div>
                ) : !adminPendingCourses?.length ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={24} className="text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Không có khóa học nào!</h3>
                        <p className="text-gray-400 text-sm">Tất cả khóa học đã được xử lý.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {adminPendingCourses.map(course => (
                            <CourseRow
                                key={course._id}
                                course={course}
                                onView={id => navigate(`/admin/pending-courses/${id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {adminPendingPagination?.totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={adminPendingPagination.totalPages}
                            onPageChange={p => { setCurrentPage(p); window.scrollTo(0, 0); }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPendingCourses;
