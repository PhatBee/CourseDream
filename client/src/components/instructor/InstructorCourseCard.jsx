import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Edit2, Trash2, Eye, Lock, RefreshCw, Archive } from 'lucide-react';

const InstructorCourseCard = ({ course, onDelete, onActivate }) => {
    const {
        _id,
        title,
        thumbnail,
        price,
        priceDiscount,
        totalLectures,
        totalHours,
        status,         // Backend trả về: 'published', 'draft', 'pending', 'hidden', 'archived'
        slug,
        revisionStatus, // Backend trả về: 'draft', 'pending', null
        type,            // Backend trả về: 'course' hoặc 'revision' (để phân biệt nếu cần)
        studentsCount = 0
    } = course;

    // --- LOGIC XÁC ĐỊNH TRƯỜNG HỢP (CASE) ---

    // Case 4: Đang chờ duyệt (Pending)
    // Xảy ra khi: Status chính là pending HOẶC có bản revision đang pending
    const isPendingReview = status === 'pending' || revisionStatus === 'pending';

    // Case 5: Bị từ chối (Rejected)
    const isRejected = status === 'rejected' || revisionStatus === 'rejected';

    // Case 1: Course đang nháp hoàn toàn (Chưa từng publish)
    // Xảy ra khi: Status là draft (có thể từ course gốc hoặc revision độc lập) VÀ không pending và không rejected
    const isFreshDraft = (status === 'draft' || status === 'hidden') && !isPendingReview && !isRejected;

    // Case 3: Course đã publish NHƯNG đang có bản edit (Draft update)
    const isPublishedWithDraft = status === 'published' && revisionStatus === 'draft';

    // Case 2: Course đã publish và sạch sẽ (Không có draft update)
    const isPurePublished = status === 'published' && !revisionStatus;

    const isHidden = status === 'hidden';
    const isArchived = status === 'archived';

    // Helper format giá
    const formatPrice = (amount) => {
        if (amount === 0) return 'Free';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Helper hiển thị Badge Status
    const renderStatusBadge = () => {
        if (isPendingReview) {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded uppercase flex items-center gap-1">Waiting for Review</span>;
        }
        if (isRejected) {
            return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase flex items-center gap-1">Rejected</span>;
        }
        if (isPublishedWithDraft) {
            return (
                <div className="flex flex-col gap-1 items-start">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Published</span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded border border-gray-300 uppercase">+ Draft Update</span>
                </div>
            );
        }
        if (isFreshDraft) {
            return <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded uppercase">Draft</span>;
        }
        if (isPurePublished) {
            return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Published</span>;
        }
        if (isHidden) return <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded uppercase">Hidden</span>;
        if (isArchived) return <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded uppercase">Archived</span>;
        return null;
    };

    // Helper Logic Button
    const getEditButton = () => {
        // Link Edit: Luôn dùng slug (Backend đã đảm bảo revision cũng có slug)
        // Lưu ý: Nếu là revision độc lập chưa có slug đẹp, backend nên trả về ID hoặc slug tạm. 
        // Logic route frontend: /instructor/courses/:slug/edit
        const editLink = `/instructor/courses/${slug}/edit`;

        // TRƯỜNG HỢP B: Hidden -> Không được Edit
        if (isHidden) {
            return (
                <button disabled className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed">
                    <Lock size={16} /> Locked (Hidden)
                </button>
            );
        }

        // Nếu đang pending duyệt -> Disable edit hoàn toàn
        if (isPendingReview) {
            return (
                <button disabled className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed">
                    <Lock size={16} /> Locked (Reviewing)
                </button>
            );
        }

        // Nếu bị rejected -> Cho phép edit với message khác
        if (isRejected) {
            return (
                <Link to={editLink} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 transition-colors font-medium">
                    <Edit2 size={16} /> Fix & Resubmit
                </Link>
            );
        }

        if (isFreshDraft) {
            return (
                <Link to={editLink} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
                    <Edit2 size={16} /> Continue Editing
                </Link>
            );
        }

        if (isPublishedWithDraft) {
            return (
                <Link to={editLink} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
                    <Edit2 size={16} /> Edit Draft
                </Link>
            );
        }

        // isPurePublished
        return (
            <Link to={editLink} className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Edit2 size={16} /> {isArchived ? 'Edit to Republish' : 'Edit Course'}
            </Link>
        );
    };

    // Helper Nút Action (Delete/Activate)
    const getActionButton = () => {
        // Nếu Hidden -> Nút Activate
        if (isHidden) {
            return (
                <button onClick={() => onActivate(_id)} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800 transition-colors">
                    <RefreshCw size={16} /> Publish
                </button>
            );
        }

        // Với Archived: Không hiện nút Delete nữa (vì đã archive rồi), cũng không hiện Activate (phải edit submit lại)
        if (isArchived) {
            return <span className="text-sm text-gray-400 italic">Archived</span>;
        }

        // Các trường hợp khác -> Nút Delete (System sẽ tự handle logic Delete/Archive)
        // Icon và Text có thể thay đổi để UX tốt hơn
        let label = "Delete";
        let Icon = Trash2;
        let colorClass = "text-gray-500 hover:text-red-600";

        if (status === 'published' && studentsCount > 0) {
            label = "Archive"; // Gợi ý cho user biết
            Icon = Archive;
        }
        // Case B: Không học viên -> Text là Hide (hoặc Delete để user hiểu xóa khỏi chợ)
        else if (status === 'published' && (!studentsCount || studentsCount === 0)) {
            label = "Hide"; // User bấm Delete, modal sẽ báo là chuyển thành Hidden
            Icon = Lock;
        }

        return (
            <button
                onClick={() => !isPendingReview && onDelete(course)}
                disabled={isPendingReview}
                className={`flex items-center gap-1 text-sm transition-colors ${isPendingReview ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600'}`}
            >
                <Icon size={16} /> {label}
            </button>
        );
    };



    return (
        <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Thumbnail Logic */}
            <div className="relative overflow-hidden h-48 bg-gray-100">
                {/* Case 1: Làm mờ ảnh nếu là Fresh Draft */}
                <div className={isFreshDraft ? "opacity-60 grayscale filter transition-all group-hover:opacity-90 group-hover:grayscale-0" : ""}>
                    {!isPendingReview ? (
                        <Link to={`/instructor/courses/${slug}/edit`}>
                            <img
                                src={thumbnail || '/default-course.svg'}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => { e.target.src = '/default-course.svg'; }}
                            />
                        </Link>
                    ) : (
                        <img
                            src={thumbnail || '/default-course.svg'}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/default-course.svg'; }}
                        />
                    )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                    {renderStatusBadge()}
                </div>

                {/* View Button (Chỉ hiện khi đã published thật sự) */}
                {(status === 'published') && (
                    <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Link to={`/courses/${slug}`} title="View Live Page"><Eye size={16} /></Link>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-lg font-bold text-blue-600">
                        {price === 0 ? 'Free' : formatPrice(priceDiscount || price)}
                        {price > 0 && priceDiscount < price && (
                            <span className="text-xs text-gray-400 line-through ml-2">{formatPrice(price)}</span>
                        )}
                    </div>
                </div>

                {/* Title */}
                <div className="block mb-3 flex-grow">
                    <h3 className="text-base font-bold text-gray-800 line-clamp-2" title={title}>
                        {title}
                    </h3>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-3 mb-3">
                    <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span>{totalLectures || 0} Lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{totalHours || 0} Hours</span>
                    </div>
                </div>

                {/* Review Message (Nếu bị rejected) */}
                {isRejected && course.reviewMessage && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                        <p className="font-semibold text-red-700 mb-1">❌ Lý do từ chối:</p>
                        <p className="text-red-600">{course.reviewMessage}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center mt-auto">
                    {getActionButton()}
                    {getEditButton()}
                </div>
            </div>
        </div>
    );
};
export default InstructorCourseCard;