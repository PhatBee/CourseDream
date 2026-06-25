import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getInstructorCourses,
  deleteInstructorCourse,
  activateInstructorCourse,
} from '../../features/course/courseSlice';
import InstructorCourseCard from '../../components/instructor/InstructorCourseCard';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import RemoveModal from '../../components/common/RemoveModal';
import {
  PlusCircle,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  AlertCircle,
  Archive,
  EyeOff,
  XCircle,
  BanIcon,
  AlertTriangle,
} from 'lucide-react';

// ======================== STAT CARD ========================
const StatCard = ({ icon, title, value, color, bgColor, onClick, active }) => (
  <button
    onClick={onClick}
    className={`group relative rounded-2xl p-5 text-left transition-all duration-200 border-2 ${
      active
        ? `${bgColor} border-current shadow-lg scale-105`
        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          active ? 'bg-white/30' : bgColor
        }`}
      >
        <span className={active ? 'text-white' : color}>{icon}</span>
      </div>
      <span className={`text-2xl font-black ${active ? 'text-white' : 'text-gray-900'}`}>{value ?? 0}</span>
    </div>
    <p
      className={`text-xs font-semibold uppercase tracking-wide ${
        active ? 'text-white/80' : 'text-gray-500'
      }`}
    >
      {title}
    </p>
  </button>
);

// ======================== STATUS TAB ========================
const STATUS_TABS = [
  { key: 'all', label: 'Tất cả', icon: <BookOpen size={14} /> },
  { key: 'published', label: 'Đã xuất bản', icon: <CheckCircle2 size={14} /> },
  { key: 'pending', label: 'Chờ duyệt', icon: <Clock3 size={14} /> },
  { key: 'changes_requested', label: 'Cần sửa', icon: <AlertTriangle size={14} /> },
  { key: 'draft', label: 'Nháp', icon: <FileText size={14} /> },
  { key: 'rejected', label: 'Từ chối', icon: <XCircle size={14} /> },
  { key: 'hidden', label: 'Ẩn', icon: <EyeOff size={14} /> },
  { key: 'unpublished', label: 'Unpublished', icon: <EyeOff size={14} /> },
  { key: 'archived', label: 'Lưu trữ', icon: <Archive size={14} /> },
  { key: 'suspended', label: 'Bị đình chỉ', icon: <BanIcon size={14} /> },
];

const STAT_CONFIG = [
  { key: 'all', title: 'Tất cả', icon: <BookOpen size={16} />, color: 'text-gray-600', bgColor: 'bg-gray-600' },
  { key: 'published', title: 'Đã xuất bản', icon: <CheckCircle2 size={16} />, color: 'text-emerald-600', bgColor: 'bg-emerald-500' },
  { key: 'pending', title: 'Chờ duyệt', icon: <Clock3 size={16} />, color: 'text-amber-600', bgColor: 'bg-amber-500' },
  { key: 'changes_requested', title: 'Cần sửa', icon: <AlertTriangle size={16} />, color: 'text-orange-600', bgColor: 'bg-orange-500' },
  { key: 'draft', title: 'Nháp', icon: <FileText size={16} />, color: 'text-gray-600', bgColor: 'bg-gray-400' },
  { key: 'rejected', title: 'Từ chối', icon: <XCircle size={16} />, color: 'text-red-600', bgColor: 'bg-red-500' },
];

// ======================== MAIN COMPONENT ========================
const InstructorCourses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { instructorCourses, instructorStats, instructorPagination, isLoading } = useSelector((s) => s.course);

  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    btnLabel: '',
    btnClass: '',
  });

  useEffect(() => {
    dispatch(
      getInstructorCourses({
        page: currentPage,
        status: activeTab === 'all' ? '' : activeTab,
      })
    );
  }, [dispatch, activeTab, currentPage]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);

    const effStatus = course.revisionStatus || course.status;

    if (effStatus === 'pending') {
      toast.error('Không thể xóa khi khóa học đang chờ Admin duyệt.');
      return;
    }

    if (
      course.type === 'revision' ||
      course.status === 'draft' ||
      course.status === 'rejected' ||
      course.status === 'changes_requested'
    ) {
      setModalConfig({
        title: 'Xóa khóa học',
        message: 'Bản nháp này sẽ bị xóa vĩnh viễn. Hành động không thể hoàn tác.',
        btnLabel: 'Xóa vĩnh viễn',
        btnClass: 'bg-red-600 hover:bg-red-700',
      });
    } else if (course.revisionStatus && ['rejected', 'changes_requested', 'draft'].includes(course.revisionStatus)) {
      setModalConfig({
        title: 'Xóa bản chỉnh sửa',
        message: 'Bản chỉnh sửa sẽ bị xóa. Khóa học đang xuất bản vẫn được giữ nguyên trên marketplace.',
        btnLabel: 'Xóa bản chỉnh sửa',
        btnClass: 'bg-orange-600 hover:bg-orange-700',
      });
    } else if ((course.studentsCount || 0) > 0) {
      setModalConfig({
        title: 'Lưu trữ khóa học',
        message: `Khóa học có ${course.studentsCount} học viên đang đăng ký. Nó sẽ được chuyển sang trạng thái "Archived" — học viên cũ vẫn xem được nhưng không nhận đăng ký mới.`,
        btnLabel: 'Lưu trữ',
        btnClass: 'bg-gray-700 hover:bg-gray-800',
      });
    } else {
      setModalConfig({
        title: 'Ẩn khóa học',
        message: 'Khóa học sẽ được chuyển sang trạng thái "Hidden" và không xuất hiện trên marketplace.',
        btnLabel: 'Ẩn khóa học',
        btnClass: 'bg-gray-600 hover:bg-gray-700',
      });
    }

    setIsRemoveModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    const deleteId =
      courseToDelete.type === 'course' &&
      courseToDelete.revisionId &&
      ['rejected', 'changes_requested', 'draft'].includes(courseToDelete.revisionStatus)
        ? courseToDelete.revisionId
        : courseToDelete._id;

    await dispatch(deleteInstructorCourse(deleteId));
    setIsRemoveModalOpen(false);
    setCourseToDelete(null);

    dispatch(
      getInstructorCourses({
        page: currentPage,
        status: activeTab === 'all' ? '' : activeTab,
      })
    );
  };

  const handleActivate = (id) => {
    dispatch(activateInstructorCourse(id));
  };

  const visibleTabs = STATUS_TABS.filter(
    (t) => t.key === 'all' || (instructorStats[t.key] && instructorStats[t.key] > 0) || t.key === activeTab
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Khóa học của tôi</h1>
            <p className="text-sm text-gray-400 mt-0.5">Quản lý và theo dõi tất cả khóa học</p>
          </div>

          <Link
            to="/instructor/add-course"
            state={{ showEnterToast: true, ts: Date.now() }}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition-all shadow-md shadow-rose-200 flex-shrink-0"
          >
            <PlusCircle size={17} /> Tạo khóa học mới
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {STAT_CONFIG.map((s) => (
            <StatCard
              key={s.key}
              icon={s.icon}
              title={s.title}
              value={instructorStats?.[s.key] ?? 0}
              color={s.color}
              bgColor={s.bgColor}
              active={activeTab === s.key}
              onClick={() => handleTabChange(s.key)}
            />
          ))}
        </div>

        {(instructorStats?.changes_requested || 0) > 0 && (
          <div className="mb-5 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-orange-800 text-sm">
                {instructorStats.changes_requested} khóa học cần chỉnh sửa theo yêu cầu Admin
              </p>
              <p className="text-orange-600 text-xs mt-0.5">
                Xem lại phản hồi và chỉnh sửa để tiếp tục quá trình duyệt.
              </p>
            </div>
            <button
              onClick={() => handleTabChange('changes_requested')}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition flex-shrink-0"
            >
              Xem ngay
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {visibleTabs.map((tab) => {
              const count = tab.key === 'all' ? instructorStats?.all : instructorStats?.[tab.key];
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner color="border-rose-500" />
          </div>
        ) : instructorCourses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {instructorCourses.map((course) => (
                <InstructorCourseCard
                  key={course._id}
                  course={course}
                  onDelete={handleDeleteClick}
                  onActivate={handleActivate}
                />
              ))}
            </div>

            <Pagination
              currentPage={instructorPagination?.page || 1}
              totalPages={instructorPagination?.totalPages || 1}
              onPageChange={(p) => {
                setCurrentPage(p);
                window.scrollTo(0, 0);
              }}
            />
          </>
        ) : (
          <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">Chưa có khóa học nào</h3>
            <p className="text-gray-400 text-sm mb-5">Hãy bắt đầu tạo khóa học đầu tiên của bạn!</p>
            <Link
              to="/instructor/add-course"
              state={{ showEnterToast: true, ts: Date.now() }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold text-sm hover:bg-rose-700 transition"
            >
              <PlusCircle size={16} /> Tạo khóa học ngay
            </Link>
          </div>
        )}
      </div>

      <RemoveModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmDelete}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel={modalConfig.btnLabel} 
        confirmBtnClass={modalConfig.btnClass || 'bg-red-500 hover:bg-red-600 shadow-red-200'}
        isDeleting={isLoading}
      />
    </div>
  );
};

export default InstructorCourses;

