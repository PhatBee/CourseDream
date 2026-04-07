// src/components/instructor/InstructorCourseCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen, Clock, Edit2, Trash2, Eye, Lock, RefreshCw, Archive,
    CheckCircle2, Clock3, AlertTriangle, XCircle, EyeOff, BanIcon,
    ChevronDown, ChevronUp, MessageSquareWarning
} from 'lucide-react';

// ======================== STATUS CONFIG ========================
const STATUS_CONFIG = {
    published: { label: 'Xuất bản', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-400' },
    pending: { label: 'Chờ duyệt', badge: 'bg-amber-400 text-white', dot: 'bg-amber-400' },
    changes_requested: { label: 'Cần sửa', badge: 'bg-orange-500 text-white', dot: 'bg-orange-400' },
    draft: { label: 'Nháp', badge: 'bg-gray-200 text-gray-600', dot: 'bg-gray-300' },
    rejected: { label: 'Từ chối', badge: 'bg-red-500 text-white', dot: 'bg-red-400' },
    hidden: { label: 'Ẩn', badge: 'bg-gray-500 text-white', dot: 'bg-gray-400' },
    unpublished: { label: 'Unpublished', badge: 'bg-slate-400 text-white', dot: 'bg-slate-400' },
    archived: { label: 'Lưu trữ', badge: 'bg-purple-400 text-white', dot: 'bg-purple-400' },
    suspended: { label: 'Bị đình chỉ', badge: 'bg-red-700 text-white', dot: 'bg-red-600' },
};

const formatPrice = (amount) => {
    if (!amount || amount === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// ======================== MAIN COMPONENT ========================
const InstructorCourseCard = ({ course, onDelete, onActivate }) => {
    const {
        _id, title, thumbnail, price, priceDiscount,
        totalLectures, totalHours, status,
        slug, revisionStatus, type, studentsCount = 0,
        reviewMessage, reviewHistory = []
    } = course;

    const [showFeedback, setShowFeedback] = useState(false);

    // Effective status dùng để quyết định hiển thị
    const effectiveStatus = revisionStatus || status;
    const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.draft;

    // Flags
    const isPending = effectiveStatus === 'pending';
    const isChangesRequested = effectiveStatus === 'changes_requested';
    const isRejected = effectiveStatus === 'rejected';
    const isPublished = status === 'published';
    const isHidden = status === 'hidden' || status === 'unpublished';
    const isArchived = status === 'archived';
    const isSuspended = status === 'suspended';
    const isDraft = effectiveStatus === 'draft';

    // Edit link
    const editLink = `/instructor/courses/${slug}/edit`;

    // Can edit?
    const canEdit = !isPending && !isSuspended;
    const isLocked = isPending || isSuspended;

    // Has feedback to show?
    const hasFeedback = (isChangesRequested || isRejected) && reviewMessage;

    // ======================== RENDER HELPERS ========================
    const renderEditBtn = () => {
        if (isLocked) return (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 cursor-not-allowed">
                <Lock size={13} /> {isPending ? 'Đang xét duyệt' : 'Bị đình chỉ'}
            </span>
        );

        let label = 'Chỉnh sửa';
        let colorCls = 'text-gray-600 hover:text-rose-600';

        if (isChangesRequested) { label = 'Sửa & Gửi lại'; colorCls = 'text-orange-600 hover:text-orange-700 font-bold'; }
        else if (isRejected) { label = 'Sửa & Gửi lại'; colorCls = 'text-red-600 hover:text-red-700 font-bold'; }
        else if (isDraft) { label = 'Tiếp tục soạn'; colorCls = 'text-rose-600 hover:text-rose-700'; }
        else if (isPublished && revisionStatus === 'draft') { label = 'Sửa bản nháp'; }

        return (
            <Link
                to={editLink}
                state={{ showEnterToast: true, ts: Date.now() }}
                className={`flex items-center gap-1.5 text-xs transition-colors ${colorCls}`}>
                <Edit2 size={13} /> {label}
            </Link>
        );
    };

    const renderActionBtn = () => {
        if (isHidden || status === 'unpublished') return (
            <button onClick={() => onActivate(_id)} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-semibold">
                <RefreshCw size={13} /> Xuất bản lại
            </button>
        );

        if (isArchived) return (
            <span className="text-xs text-gray-400 italic flex items-center gap-1">
                <Archive size={13} /> Đã lưu trữ
            </span>
        );

        if (isSuspended) return (
            <span className="text-xs text-red-500 italic flex items-center gap-1">
                <BanIcon size={13} /> Liên hệ Admin
            </span>
        );

        const disabled = isPending;
        let label = 'Xóa';
        let Icon = Trash2;
        if (isPublished && studentsCount > 0) { label = 'Lưu trữ'; Icon = Archive; }
        else if (isPublished && !studentsCount) { label = 'Ẩn'; Icon = EyeOff; }

        return (
            <button
                onClick={() => !disabled && onDelete(course)}
                disabled={disabled}
                className={`flex items-center gap-1.5 text-xs transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600'}`}
            >
                <Icon size={13} /> {label}
            </button>
        );
    };

    // ======================== RENDER ========================
    return (
        <div className={`group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden ${isChangesRequested ? 'border-orange-300 ring-2 ring-orange-100' :
            isRejected ? 'border-red-200' :
                isSuspended ? 'border-red-300 ring-2 ring-red-100' :
                    'border-gray-100'
            }`}>

            {/* Suspend Banner */}
            {isSuspended && (
                <div className="bg-red-600 text-white text-xs font-bold px-4 py-2 flex items-center gap-2">
                    <BanIcon size={13} /> Khóa học bị đình chỉ bởi Admin{course.suspendReason && `: ${course.suspendReason}`}
                </div>
            )}

            {/* Thumbnail */}
            <div className="relative h-44 bg-gray-100 overflow-hidden flex-shrink-0">
                {canEdit && !isSuspended ? (
                    <Link to={editLink} state={{ showEnterToast: true, ts: Date.now() }}>
                        <img src={thumbnail || '/default-course.svg'} alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={e => e.target.src = '/default-course.svg'} />
                    </Link>
                ) : (
                    <img src={thumbnail || '/default-course.svg'} alt={title}
                        className={`w-full h-full object-cover ${isSuspended || isPending ? 'grayscale opacity-60' : ''}`}
                        onError={e => e.target.src = '/default-course.svg'} />
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${config.badge}`}>
                        {config.label}
                    </span>
                    {isPublished && revisionStatus === 'draft' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            + Bản nháp
                        </span>
                    )}
                </div>

                {/* View live */}
                {isPublished && (
                    <Link to={`/courses/${slug}`} target="_blank"
                        className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        title="Xem trang khóa học">
                        <Eye size={14} />
                    </Link>
                )}

                {/* Students badge */}
                {studentsCount > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        👥 {studentsCount}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base font-black text-rose-600">
                        {formatPrice(priceDiscount || price)}
                    </span>
                    {price > 0 && priceDiscount && priceDiscount < price && (
                        <span className="text-xs text-gray-400 line-through">{formatPrice(price)}</span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-3 flex-grow leading-snug" title={title}>
                    {title || 'Khóa học chưa đặt tên'}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-3 mb-3">
                    <span className="flex items-center gap-1"><BookOpen size={12} /> {totalLectures || 0} bài</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {totalHours ? `${totalHours}h` : '--'}</span>
                    {studentsCount > 0 && <span className="flex items-center gap-1">👥 {studentsCount}</span>}
                </div>

                {/* Feedback Panel (Changes Requested / Rejected) */}
                {hasFeedback && (
                    <div className={`mb-3 rounded-xl overflow-hidden border ${isChangesRequested ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
                        <button
                            onClick={() => setShowFeedback(p => !p)}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold ${isChangesRequested ? 'text-orange-700' : 'text-red-700'}`}
                        >
                            <span className="flex items-center gap-1.5">
                                <MessageSquareWarning size={13} />
                                {isChangesRequested ? 'Yêu cầu sửa từ Admin' : 'Lý do từ chối'}
                            </span>
                            {showFeedback ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {showFeedback && (
                            <div className={`px-3 pb-3 text-xs border-t ${isChangesRequested ? 'border-orange-200 text-orange-700' : 'border-red-200 text-red-700'}`}>
                                <p className="pt-2 leading-relaxed">{reviewMessage}</p>

                                {/* History */}
                                {reviewHistory.length > 1 && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer opacity-60 hover:opacity-100">
                                            {reviewHistory.length - 1} phản hồi trước đó
                                        </summary>
                                        <div className="mt-1 space-y-1">
                                            {reviewHistory.slice(0, -1).reverse().map((h, i) => (
                                                <p key={i} className="opacity-70">• {h.message}</p>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pending message */}
                {isPending && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                        <Clock3 size={12} className="flex-shrink-0" />
                        <span>Đang được Admin xét duyệt. Bạn sẽ nhận thông báo khi có kết quả.</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-auto pt-1">
                    {renderActionBtn()}
                    {renderEditBtn()}
                </div>
            </div>
        </div>
    );
};

export default InstructorCourseCard;