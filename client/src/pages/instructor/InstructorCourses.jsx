import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getInstructorCourses } from '../../features/course/courseSlice';
import InstructorCourseCard from '../../components/instructor/InstructorCourseCard';
import Pagination from '../../components/common/Pagination'; // Import component Pagination bạn đã có
import { Link } from 'react-router-dom';
import { PlusCircle, BookOpen, FileText, AlertCircle, Archive, Lock, XCircle } from 'lucide-react';
import Spinner from '../../components/common/Spinner';
import RemoveModal from '../../components/common/RemoveModal';
import { deleteInstructorCourse, activateInstructorCourse } from '../../features/course/courseSlice';

const InstructorCourses = () => {
    const dispatch = useDispatch();
    const { instructorCourses, instructorStats, instructorPagination, isLoading } = useSelector(state => state.course);

    const [activeTab, setActiveTab] = useState('all'); // all, published, pending, draft...
    const [currentPage, setCurrentPage] = useState(1);

    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [modalConfig, setModalConfig] = useState({ title: '', message: '', btnLabel: '' });

    // Gọi API khi tab hoặc page thay đổi
    useEffect(() => {
        dispatch(getInstructorCourses({
            page: currentPage,
            status: activeTab === 'all' ? '' : activeTab
        }));
    }, [dispatch, activeTab, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset về trang 1 khi đổi tab
    };

    // Handle Click Delete Button từ Card
    const handleDeleteClick = (course) => {
        setCourseToDelete(course);

        // TRƯỜNG HỢP A: Fresh Draft (Chưa có trong Course Model)
        // Dấu hiệu nhận biết: status là 'draft' và không phải là bản update của course đã publish
        // (Hoặc đơn giản là status = 'draft' vì Backend đã gộp list trả về chuẩn rồi)
        if (course.status === 'draft') {
            setModalConfig({
                title: "Xóa khóa học Draft",
                message: "Đây là khóa học chưa được publish. Nó sẽ bị xóa vĩnh viễn cùng với tất cả nội dung. Hành động này không thể được hoàn tác.",
                btnLabel: "Xóa vĩnh viễn" // Hành động: Xóa cứng
            });
        }
        // // TRƯỜNG HỢP C: Đã có học viên
        else if (course.studentsCount > 0) {
            setModalConfig({
                title: "Archive khóa học",
                message: `Khóa học này có ${course.studentsCount} sinh viên đã đăng ký. Nó không thể bị xóa. Thay vào đó, nó sẽ được chuyển đến trạng thái "Archived". Sinh viên hiện tại vẫn có thể truy cập nó, nhưng không có thêm các đăng ký mới được cho phép.`,
                btnLabel: "Archive khóa học"
            });
        }
        // TRƯỜNG HỢP B: Published/Hidden nhưng chưa có học viên
        else {
            setModalConfig({
                title: "Ẩn khóa học",
                message: "Khóa học này chưa có sinh viên nào đăng ký. Nó sẽ được chuyển đến trạng thái 'Hidden'. Nó sẽ không xuất hiện trên trang web, và bạn không thể chỉnh sửa nó cho đến khi bạn publish nó lại.",
                btnLabel: "Ẩn khóa học"
            });
        }

        setIsRemoveModalOpen(true);
    };

    const confirmDelete = async () => {
        if (courseToDelete) {
            // Gọi action delete chung, backend tự quyết định xóa thật hay ẩn dựa trên logic service
            await dispatch(deleteInstructorCourse(courseToDelete._id));
            setIsRemoveModalOpen(false);
            setCourseToDelete(null);
        }
    };

    const handleActivate = (id) => {
        dispatch(activateInstructorCourse(id));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <StatCard icon={<BookOpen className="text-white" />} title="Total Courses" value={instructorStats.all} color="bg-blue-500" />
                    <StatCard icon={<CheckCircle className="text-white" />} title="Published" value={instructorStats.published} color="bg-green-500" />
                    <StatCard icon={<AlertCircle className="text-white" />} title="Pending" value={instructorStats.pending} color="bg-yellow-500" />
                    <StatCard icon={<FileText className="text-white" />} title="Drafts" value={instructorStats.draft} color="bg-gray-500" />
                    <StatCard icon={<XCircle className="text-white" />} title="Rejected" value={instructorStats.rejected} color="bg-red-500" />
                    <StatCard icon={<Lock className="text-white" />} title="Hidden" value={instructorStats.hidden} color="bg-orange-500" />
                    <StatCard icon={<Archive className="text-white" />} title="Archived" value={instructorStats.archived} color="bg-purple-500" />
                </div>

                {/* Header & Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">My Courses</h1>
                    <Link to="/instructor/add-course" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 transition">
                        <PlusCircle size={18} /> Create New Course
                    </Link>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex overflow-x-auto">
                        {['all', 'published', 'pending', 'draft', 'rejected', 'hidden', 'archived'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`px-6 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                    {tab === 'all' ? instructorStats.all : instructorStats[tab] || 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course Grid */}
                {isLoading ? (
                    <div className="flex justify-center py-20"><Spinner /></div>
                ) : instructorCourses.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructorCourses.map(course => (
                                <InstructorCourseCard
                                    key={course._id}
                                    course={course}
                                    onDelete={handleDeleteClick} // Pass function mở modal
                                    onActivate={handleActivate}  // Pass function kích hoạt lại
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <Pagination
                            currentPage={instructorPagination.page}
                            totalPages={instructorPagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <Archive className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
                        <p className="text-gray-500">Get started by creating your first course.</p>
                    </div>
                )}
            </div>

            {/* Remove Modal */}
            <RemoveModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                onConfirm={confirmDelete}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmLabel={modalConfig.btnLabel}
                isDeleting={isLoading} // Tận dụng loading state của redux hoặc tạo local state
            />
        </div>
    );
};

// Helper Component cho Card Thống kê
const StatCard = ({ icon, title, value, color }) => (
    <div className={`${color} rounded-xl p-4 shadow-md text-white flex items-center justify-between`}>
        <div>
            <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
        </div>
    </div>
);

// Helper Icon (vì lucide không có CheckCircle mặc định ở trên)
const CheckCircle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);

export default InstructorCourses;