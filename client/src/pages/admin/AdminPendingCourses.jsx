import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAdminPendingCourses } from '../../features/course/courseSlice';

const AdminPendingCourses = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { adminPendingCourses, adminPendingPagination, isLoading } = useSelector(
        (state) => state.course
    );

    const [currentPage, setCurrentPage] = React.useState(1);

    useEffect(() => {
        dispatch(getAdminPendingCourses({
            page: currentPage,
            limit: 10
        }));
    }, [dispatch, currentPage]);

    const handleViewDetail = (revisionId) => {
        navigate(`/admin/pending-courses/${revisionId}`);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo(0, 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading && currentPage === 1) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h1 className="text-3xl font-bold mb-6">Khóa học đang chờ duyệt</h1>

                {adminPendingCourses.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Không có khóa học nào đang chờ duyệt</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {adminPendingCourses.map((course) => (
                            <div
                                key={course._id}
                                className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => handleViewDetail(course._id)}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded overflow-hidden">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* thông tin */}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">{course.title}</h3>

                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {course.instructor?.name}
                                            </span>
                                            <span>{formatDate(course.submittedAt)}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {course.type === 'new' ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                    Khóa học mới
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                    Cập nhật khóa học
                                                </span>
                                            )}

                                            {course.courseName && (
                                                <span className="text-sm text-gray-500">
                                                    (Từ: {course.courseName})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div>
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetail(course._id);
                                            }}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {adminPendingPagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Trước
                        </button>

                        <span className="px-4 py-2">
                            Trang {currentPage} / {adminPendingPagination.totalPages}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === adminPendingPagination.totalPages}
                            className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPendingCourses;
