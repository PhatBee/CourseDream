import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Edit2, Trash2, MoreVertical, Eye } from 'lucide-react';

const InstructorCourseCard = ({ course, onDelete }) => {
    const {
        _id,
        title,
        thumbnail,
        price,
        priceDiscount,
        totalLectures,
        totalHours,
        status,
        slug
    } = course;

    // Helper format giá
    const formatPrice = (amount) => {
        if (amount === 0) return 'Free';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Helper màu status
    const getStatusBadge = (status) => {
        switch (status) {
            case 'published': return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded uppercase">Published</span>;
            case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded uppercase">Pending</span>;
            case 'draft': return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded uppercase">Draft</span>;
            case 'hidden': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded uppercase">Hidden</span>;
            default: return null;
        }
    };

    return (
        <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Thumbnail */}
            <div className="relative overflow-hidden h-48">
                <Link to={`/instructor/courses/${slug}/edit`}> {/* Link sửa */}
                    <img
                        src={thumbnail || '/default-course.svg'}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = '/default-course.svg'; }}
                    />
                </Link>
                <div className="absolute top-3 left-3">
                    {getStatusBadge(status)}
                </div>
                <div className="absolute top-3 right-3 bg-black/50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/courses/${slug}`} title="View as Student"><Eye size={16} /></Link>
                </div>
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

                <Link to={`/instructor/courses/${slug}/edit`} className="block mb-3 flex-grow">
                    <h3 className="text-base font-bold text-gray-800 line-clamp-2 hover:text-blue-600 transition-colors">
                        {title}
                    </h3>
                </Link>

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
                    <button
                        onClick={() => onDelete(_id)}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                        <Trash2 size={16} /> Delete
                    </button>

                    <Link
                        to={`/instructor/courses/${slug}/edit`}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <Edit2 size={16} /> Edit
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default InstructorCourseCard;