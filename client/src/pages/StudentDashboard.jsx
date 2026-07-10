import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentDashboard } from '../features/enrollment/enrollmentSlice';
import LearningCourseCard from '../components/dashboard/LearningCourseCard';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import Spinner from '../components/common/Spinner';
import Pagination from '../components/common/Pagination';

const ITEMS_PER_PAGE = 9;

const StatBadge = ({ icon, label, value, color }) => (
  <div className={`flex items-center p-4 rounded-xl border border-gray-100 ${color} bg-opacity-10`}>
    <div className={`p-3 rounded-full ${color} text-white mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const dispatch = useDispatch();

  const { dashboardCourses, isLoading } = useSelector((state) => state.enrollment);
  const { user } = useSelector((state) => state.auth);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchStudentDashboard());
  }, [dispatch]);

  const enrolledCourses = dashboardCourses || [];
  console.log(enrolledCourses)


  if (isLoading) {
    return <div className="flex h-64 justify-center items-center"><Spinner /></div>;
  }

  // Tính toán thống kê nhanh
  const totalCourses = enrolledCourses?.length || 0;
  const completedCourses = enrolledCourses?.filter(item => item.learningProgress?.percentage === 100).length || 0;
  const inProgressCourses = totalCourses - completedCourses;

  const totalPages = Math.ceil(totalCourses / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentCourses = enrolledCourses.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const listElement = document.getElementById('learning-list');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tổng quan</h2>
        <p className="text-gray-500">Chào mừng trở lại , <span className="font-semibold text-gray-900">{user?.name}</span>! Bạn đã sẵn sàng học điều gì mới chưa?</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatBadge
            icon={<BookOpen size={20} />}
            label="Khóa học đã đăng ký"
            value={totalCourses}
            color="bg-blue-500"
          />
          <StatBadge
            icon={<Clock size={20} />}
            label="Đang học"
            value={inProgressCourses}
            color="bg-yellow-500"
          />
          <StatBadge
            icon={<Award size={20} />}
            label="Hoàn thành"
            value={completedCourses}
            color="bg-green-500"
          />
        </div>
      </div>

      {/* 2. Behind Schedule Alerts */}
      {enrolledCourses.filter(item => item.learningProgress?.scheduleStatus === 'behind').length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-2xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 mt-1 md:mt-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <h4 className="font-extrabold text-amber-900 text-base">Bạn đang bị trễ tiến độ học tập!</h4>
              <p className="text-sm text-amber-700 mt-0.5 font-medium">
                Bạn đang chậm hơn lộ trình đề xuất ở {enrolledCourses.filter(item => item.learningProgress?.scheduleStatus === 'behind').length} khóa học.
                khuyên bạn nên hoàn thành ít nhất 2 bài học mỗi tuần để duy trì đà tiếp thu tốt nhất!
              </p>
            </div>
          </div>
          <a
            href="#learning-list"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-200 text-center whitespace-nowrap"
          >
            Học bù ngay
          </a>
        </div>
      )}

      {/* 3. Course In Progress Section */}
      <div id="learning-list">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Khóa học đang học</h3>
          {/* Có thể thêm Filter: All / In Progress / Completed */}
        </div>

        <div className="space-y-4">
          {currentCourses.length > 0 ? (
            <>
              {currentCourses.map((enrollment) => (
                <LearningCourseCard key={enrollment._id} enrollment={enrollment} />
              ))}

              {totalCourses > ITEMS_PER_PAGE && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">Bạn chưa ghi danh khóa học nào.</p>
              <a href="/courses" className="text-rose-600 font-bold hover:underline">Tìm khóa học</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;