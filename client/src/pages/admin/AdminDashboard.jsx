import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../features/admin/adminSlice';
import StatsCard from '../../components/admin/StatsCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import UserAnalytics from '../../components/admin/dashboard/UserAnalytics';
import TopCoursesList from '../../components/admin/dashboard/TopCoursesList';
import { BookOpen, Users, DollarSign, UserCheck, Loader } from 'lucide-react';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { stats, revenueData, isLoading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    // (RevenueChart tự gọi API của nó bên trong component)
  }, [dispatch]);

  if (isLoading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="animate-spin text-rose-600" size={40} />
      </div>
    );
  }

  const counts = stats?.counts || {};
  const topCourses = stats?.topCourses || [];
  const totalRevenue = revenueData?.totalRevenue || 0;

  // Dữ liệu giả lập cho active students (Bạn cần API backend trả về số này thực tế)
  const totalStudents = counts.users?.students || 0;
  const activeStudents = Math.round(totalStudents * 0.65); // Ví dụ: 65% đã mua khóa học

  const statsCards = [
    { title: 'Tổng học viên', value: totalStudents, icon: Users, color: 'bg-blue-500' },
    { title: 'Tổng giảng viên', value: counts.users?.instructors || 0, icon: UserCheck, color: 'bg-green-500' },
    { title: 'Khóa học đã xuất bản', value: counts.courses?.published || 0, icon: BookOpen, color: 'bg-orange-500' },
    {
      title: 'Tổng doanh thu',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue),
      icon: DollarSign,
      color: 'bg-rose-500'
    },
  ];

  return (
    <div className="space-y-6 font-inter pb-10 text-left">

      {/* 1. Header & Stats Grid */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* 2. Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Doanh thu (Chiếm 2/3) */}
        <div className="lg:col-span-2 h-full">
          <RevenueChart />
        </div>

        {/* Phân tích Học viên (Chiếm 1/3) */}
        <div className="h-full">
          <UserAnalytics totalStudents={totalStudents} activeStudents={activeStudents} />
        </div>
      </div>

      {/* 3. Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Courses (List nhỏ gọn) */}
        <div className="lg:col-span-1">
          <TopCoursesList courses={topCourses} />
        </div>

        {/* Placeholder cho phần khác (VD: Recent Activity / Category Stats) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Hoạt động gần đây</h3>
          <div className="text-center text-gray-400 py-10">
            Sắp tới: Cập nhật hoạt động thời gian thực
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;