import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Edit2, Trash2, Eye, Lock } from 'lucide-react'; // Thêm icon Lock

const InstructorCourseCard = ({ course, onDelete }) => {
    const {
        _id,
        title,
        thumbnail,
        price,
        priceDiscount,
        totalLectures,
        totalHours,
        status, // Trạng thái gốc: 'published', 'draft', 'hidden'
        slug,
        revisionStatus // Trạng thái bản sửa đổi: 'draft', 'pending', null (Từ Backend mới trả về)
    } = course;

    // --- LOGIC XÁC ĐỊNH TRƯỜNG HỢP (CASE) ---

    // Case 4 (Ưu tiên cao nhất): Đang chờ duyệt (Pending)
    // Xảy ra khi course gốc là pending HOẶC đang có revision là pending
    const isPendingReview = status === 'pending' || revisionStatus === 'pending';

    // Case 1: Course đang nháp hoàn toàn (Chưa từng publish)
    // Course gốc là draft/hidden VÀ không có revision pending nào
    const isFreshDraft = (status === 'draft' || status === 'hidden') && !isPendingReview;

    // Case 3: Course đã publish NHƯNG đang có bản edit (Draft update)
    const isPublishedWithDraft = status === 'published' && revisionStatus === 'draft';

    // Case 2: Course đã publish và sạch sẽ (Không có draft update)
    const isPurePublished = status === 'published' && !revisionStatus;

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
        return null;
    };

    // Helper Logic Button Sửa
    const getEditButton = () => {
        // Nếu đang pending duyệt -> Disable edit
        if (isPendingReview) {
            return (
                <button disabled className="flex items-center gap-1 text-sm text-gray-400 cursor-not-allowed">
                    <Lock size={16} /> Locked (Reviewing)
                </button>
            );
        }

        // Link Edit
        const editLink = `/instructor/courses/${slug}/edit`;

        if (isFreshDraft || isPublishedWithDraft) {
            return (
                <Link to={editLink} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium">
                    <Edit2 size={16} /> Continue Editing
                </Link>
            );
        }

        // isPurePublished
        return (
            <Link to={editLink} className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <Edit2 size={16} /> Edit Course
            </Link>
        );
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Thumbnail Logic: Case 1 (Fresh Draft) thì làm mờ ảnh */}
            <div className="relative overflow-hidden h-48 bg-gray-100">
                <div className={isFreshDraft ? "opacity-70 grayscale filter" : ""}>
                    {/* Nếu đang pending thì không cho click vào ảnh để sửa, ngược lại thì cho */}
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

                {/* View Button (Chỉ hiện khi đã published) */}
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
                        <span>{totalLectures} Lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{totalHours} Hours</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-auto">
                    {/* Nút Delete (Chỉ hiện khi không Pending review để an toàn, hoặc tùy logic của bạn) */}
                    <button
                        onClick={() => !isPendingReview && onDelete(_id)}
                        disabled={isPendingReview}
                        className={`flex items-center gap-1 text-sm transition-colors ${isPendingReview ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600'}`}
                    >
                        <Trash2 size={16} /> Delete
                    </button>

                    {/* Nút Edit Dynamic */}
                    {getEditButton()}
                </div>
            </div>
        </div>
    );
};

export default InstructorCourseCard;