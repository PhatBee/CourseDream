// src/pages/admin/AdminCourses.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminCourses } from '../../features/admin/adminSlice';
import { adminApi } from '../../api/adminApi';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import {
    BookOpen, Search, ChevronUp, ChevronDown, ChevronsUpDown,
    TrendingUp, Users, DollarSign, Eye, EyeOff, AlertTriangle,
    RefreshCw, Filter, X, BarChart3, GraduationCap, Layers,
    ArrowUpDown
} from 'lucide-react';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const formatVND = (amount) => {
    if (!amount && amount !== 0) return '—';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
    published: { label: 'Đang hiển thị', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
    unpublished: { label: 'Ẩn', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
    hidden: { label: 'Tạm ẩn', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    suspended: { label: 'Đình chỉ', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
    draft: { label: 'Nháp', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
    pending: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    archived: { label: 'Lưu trữ', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ─────────────────────────────────────────────
// SORT HEADER COMPONENT
// ─────────────────────────────────────────────
const SortHeader = ({ label, field, current, order, onSort }) => {
    const isActive = current === field;
    return (
        <button
            onClick={() => onSort(field)}
            className={`flex items-center gap-1 group transition-colors ${isActive ? 'text-rose-600 font-bold' : 'text-gray-500 hover:text-gray-800'
                }`}
        >
            {label}
            <span className="ml-0.5">
                {isActive ? (
                    order === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />
                ) : (
                    <ChevronsUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                )}
            </span>
        </button>
    );
};

// ─────────────────────────────────────────────
// ACTION MODAL (Unpublish / Suspend / Restore)
// ─────────────────────────────────────────────
const ActionModal = ({ course, action, onClose, onConfirm, loading }) => {
    const [reason, setReason] = useState('');
    if (!course || !action) return null;

    const CONFIG = {
        unpublish: { title: 'Ẩn khóa học', color: 'bg-gray-700', icon: <EyeOff size={18} />, needReason: false },
        republish: { title: 'Publish lại', color: 'bg-emerald-600', icon: <Eye size={18} />, needReason: false },
        suspend: { title: 'Đình chỉ khóa học', color: 'bg-red-600', icon: <AlertTriangle size={18} />, needReason: true },
        restore: { title: 'Khôi phục khóa học', color: 'bg-blue-600', icon: <Eye size={18} />, needReason: false },
    };
    const cfg = CONFIG[action];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className={`${cfg.color} text-white px-6 py-4 flex items-center gap-3`}>
                    {cfg.icon}
                    <h3 className="font-bold text-lg">{cfg.title}</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 mb-4">
                        Bạn đang thực hiện thao tác <strong>"{cfg.title}"</strong> cho khóa học:
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                        {course.thumbnail && (
                            <img src={course.thumbnail} alt="" className="w-12 h-8 object-cover rounded-lg" />
                        )}
                        <p className="font-semibold text-gray-900 text-sm line-clamp-2">{course.title}</p>
                    </div>
                    {cfg.needReason && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lý do đình chỉ <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Nhập lý do đình chỉ khóa học..."
                            />
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={() => onConfirm(reason)}
                            disabled={loading || (cfg.needReason && !reason.trim())}
                            className={`flex-1 px-4 py-2.5 ${cfg.color} text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                        >
                            {loading && <RefreshCw size={14} className="animate-spin" />}
                            Xác nhận
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const AdminCourses = () => {
    const dispatch = useDispatch();
    const { adminCoursesList, adminCoursesLoading } = useSelector(s => s.admin);

    // Filters & pagination
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatus] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const searchTimeout = useRef(null);

    // Action modal
    const [modalState, setModalState] = useState({ course: null, action: null });
    const [actionLoading, setActionLoading] = useState(false);

    const courses = adminCoursesList?.courses || [];
    const stats = adminCoursesList?.stats || {};
    const pagination = adminCoursesList?.pagination || {};

    // Fetch
    const fetchData = useCallback(() => {
        const params = {
            page,
            limit: 12,
            search,
            status: statusFilter !== 'all' ? statusFilter : '',
            sortBy,
            sortOrder,
        };
        if (minPrice !== '') params.minPrice = minPrice;
        if (maxPrice !== '') params.maxPrice = maxPrice;
        dispatch(fetchAdminCourses(params));
    }, [dispatch, page, search, statusFilter, sortBy, sortOrder, minPrice, maxPrice]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Search debounce
    const handleSearchChange = (val) => {
        setSearchInput(val);
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            setSearch(val);
            setPage(1);
        }, 450);
    };

    // Sort toggle
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPage(1);
    };

    // Status tab change
    const handleStatusChange = (s) => {
        setStatus(s);
        setPage(1);
    };

    // Reset filters
    const resetFilters = () => {
        setSearchInput('');
        setSearch('');
        setStatus('all');
        setSortBy('createdAt');
        setSortOrder('desc');
        setMinPrice('');
        setMaxPrice('');
        setPage(1);
    };

    // Actions
    const openModal = (course, action) => setModalState({ course, action });
    const closeModal = () => setModalState({ course: null, action: null });

    const handleConfirm = async (reason) => {
        const { course, action } = modalState;
        setActionLoading(true);
        try {
            if (action === 'unpublish') await adminApi.unpublishCourse(course._id, reason);
            else if (action === 'republish') await adminApi.republishCourse(course._id);
            else if (action === 'suspend') await adminApi.suspendCourse(course._id, reason);
            else if (action === 'restore') await adminApi.restoreCourse(course._id);
            toast.success('Thao tác thành công!');
            closeModal();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
        } finally {
            setActionLoading(false);
        }
    };

    // Status tabs config
    const STATUS_TABS = [
        { key: 'all', label: 'Tất cả', count: stats.all || 0 },
        { key: 'published', label: 'Đang hiển thị', count: stats.published || 0 },
        // { key: 'pending', label: 'Chờ duyệt', count: stats.pending || 0 },
        { key: 'unpublished', label: 'Ẩn', count: stats.unpublished || 0 },
        { key: 'suspended', label: 'Đình chỉ', count: stats.suspended || 0 },
        // { key: 'draft', label: 'Nháp', count: stats.draft || 0 },
    ];

    const hasActiveFilters = search || statusFilter !== 'all' || minPrice || maxPrice || sortBy !== 'createdAt';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-screen-xl mx-auto px-4 py-6 sm:px-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                            <BookOpen size={26} className="text-rose-500" />
                            Quản lý khóa học
                        </h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {pagination.total || 0} khóa học trong hệ thống
                        </p>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium shadow-sm"
                    >
                        <RefreshCw size={15} className={adminCoursesLoading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {/* ── Search & Filter Bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchInput}
                                onChange={e => handleSearchChange(e.target.value)}
                                placeholder="Tìm kiếm tên khóa học..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                            />
                            {searchInput && (
                                <button
                                    onClick={() => handleSearchChange('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Toggle filter */}
                        <button
                            onClick={() => setShowFilters(prev => !prev)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || minPrice || maxPrice
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Filter size={15} />
                            Bộ lọc
                            {(minPrice || maxPrice) && (
                                <span className="w-2 h-2 bg-rose-500 rounded-full" />
                            )}
                        </button>

                        {/* Reset */}
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                            >
                                <X size={14} /> Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {/* Expandable filter panel */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Giá tối thiểu (₫)</label>
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                                    placeholder="0"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Giá tối đa (₫)</label>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                                    placeholder="∞"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sắp xếp theo</label>
                                <select
                                    value={`${sortBy}:${sortOrder}`}
                                    onChange={e => {
                                        const [field, order] = e.target.value.split(':');
                                        setSortBy(field);
                                        setSortOrder(order);
                                        setPage(1);
                                    }}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                                >
                                    <option value="createdAt:desc">Mới nhất</option>
                                    <option value="createdAt:asc">Cũ nhất</option>
                                    <option value="revenue:desc">Doanh thu cao → thấp</option>
                                    <option value="revenue:asc">Doanh thu thấp → cao</option>
                                    <option value="students:desc">Học viên nhiều → ít</option>
                                    <option value="students:asc">Học viên ít → nhiều</option>
                                    <option value="price:desc">Giá cao → thấp</option>
                                    <option value="price:asc">Giá thấp → cao</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Status Tabs ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-x-auto">
                    <div className="flex min-w-max">
                        {STATUS_TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => handleStatusChange(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${statusFilter === tab.key
                                    ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${statusFilter === tab.key ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {adminCoursesLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <div className="w-9 h-9 border-[3px] border-rose-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-400">Đang tải dữ liệu...</p>
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={28} className="text-gray-300" />
                            </div>
                            <p className="font-semibold text-gray-700">Không có khóa học nào</p>
                            <p className="text-sm text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide w-8">#</th>
                                        <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Khóa học</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">
                                            <SortHeader label="Giá gốc" field="price" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">
                                            <SortHeader label="Học viên" field="students" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-right">
                                            <SortHeader label="Doanh thu" field="revenue" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Trạng thái</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">
                                            <SortHeader label="Ngày tạo" field="createdAt" current={sortBy} order={sortOrder} onSort={handleSort} />
                                        </th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {courses.map((course, idx) => (
                                        <CourseRow
                                            key={course._id}
                                            course={course}
                                            index={(page - 1) * 12 + idx + 1}
                                            onAction={openModal}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {pagination.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination
                            currentPage={page}
                            totalPages={pagination.totalPages}
                            onPageChange={p => { setPage(p); window.scrollTo(0, 0); }}
                        />
                    </div>
                )}
            </div>

            {/* ── Action Modal ── */}
            <ActionModal
                course={modalState.course}
                action={modalState.action}
                onClose={closeModal}
                onConfirm={handleConfirm}
                loading={actionLoading}
            />
        </div>
    );
};

// ─────────────────────────────────────────────
// COURSE ROW
// ─────────────────────────────────────────────
const CourseRow = ({ course, index, onAction }) => {
    const revenue = course.totalRevenue || 0;
    const students = course.totalStudents || 0;

    return (
        <tr className="hover:bg-rose-50/30 transition-colors group">
            {/* # */}
            <td className="px-4 py-3 text-gray-400 text-xs font-medium">{index}</td>

            {/* Course info */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-[260px]">
                    <div className="flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-gray-100">
                        {course.thumbnail ? (
                            <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <BookOpen size={16} className="text-gray-300" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-rose-600 transition-colors">
                            {course.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {course.instructor?.name || '—'}
                        </p>
                        {course.suspendReason && (
                            <p className="text-[10px] text-red-500 mt-0.5 truncate">
                                🚫 {course.suspendReason}
                            </p>
                        )}
                    </div>
                </div>
            </td>

            {/* Price */}
            <td className="px-4 py-3 text-right whitespace-nowrap">
                <span className="font-semibold text-gray-800">
                    {course.price === 0 ? (
                        <span className="text-emerald-600 font-bold">Miễn phí</span>
                    ) : formatVND(course.price)}
                </span>
            </td>

            {/* Students */}
            <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                    <GraduationCap size={14} className="text-blue-400" />
                    <span className="font-semibold text-gray-800">{students.toLocaleString('vi-VN')}</span>
                </div>
            </td>

            {/* Revenue */}
            <td className="px-4 py-3 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1.5">
                    <TrendingUp size={14} className={revenue > 0 ? 'text-emerald-500' : 'text-gray-300'} />
                    <span className={`font-bold ${revenue > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {revenue > 0 ? formatVND(revenue) : '—'}
                    </span>
                </div>
            </td>

            {/* Status */}
            <td className="px-4 py-3 text-center">
                <StatusBadge status={course.status} />
            </td>

            {/* Date */}
            <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-gray-500">
                {formatDate(course.createdAt)}
            </td>

            {/* Actions */}
            <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                    {course.status === 'published' && (
                        <button
                            onClick={() => onAction(course, 'unpublish')}
                            title="Ẩn khóa học"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                            <EyeOff size={15} />
                        </button>
                    )}
                    {course.status === 'unpublished' && (
                        <button
                            onClick={() => onAction(course, 'republish')}
                            title="Publish lại"
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                            <Eye size={15} />
                        </button>
                    )}
                    {['published', 'unpublished', 'hidden'].includes(course.status) && (
                        <button
                            onClick={() => onAction(course, 'suspend')}
                            title="Đình chỉ"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <AlertTriangle size={15} />
                        </button>
                    )}
                    {course.status === 'suspended' && (
                        <button
                            onClick={() => onAction(course, 'restore')}
                            title="Khôi phục về Unpublished"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            <Eye size={15} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AdminCourses;
