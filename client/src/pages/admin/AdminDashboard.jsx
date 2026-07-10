import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats } from '../../features/admin/adminSlice';
import StatsCard from '../../components/admin/StatsCard';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import UserAnalytics from '../../components/admin/dashboard/UserAnalytics';
import TopCoursesList from '../../components/admin/dashboard/TopCoursesList';
import { BookOpen, Users, DollarSign, UserCheck, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

  const distribution = stats?.progressScheduleStats?.distribution || { inProgress: 0, behind: 0, completed: 0 };
  const scheduleData = [
    { name: 'Đúng tiến độ', value: distribution.inProgress, color: '#3b82f6' },
    { name: 'Trễ lộ trình', value: distribution.behind, color: '#f59e0b' },
    { name: 'Hoàn thành', value: distribution.completed, color: '#10b981' }
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

        {/* Phân tích Macro - Tiến độ & Trễ hạn (Chiếm 2/3) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          {/* Pie Chart: Progress Distribution */}
          <div className="flex flex-col justify-between">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Phân bố Tiến độ Học tập</h3>
            <div className="flex-1 min-h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scheduleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {scheduleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} học viên`, 'Số lượng']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Courses with Highest Behind Rate */}
          <div className="flex flex-col justify-between">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Top khóa học tỷ lệ trễ cao</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {stats?.progressScheduleStats?.topBehindCourses?.length > 0 ? (
                stats.progressScheduleStats.topBehindCourses.map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={course.thumbnail || "/src/assets/img/course-placeholder.png"}
                        className="w-12 h-9 object-cover rounded-lg border border-gray-200"
                        alt={course.title}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-xs truncate">{course.title}</p>
                        <p className="text-[10px] text-gray-400">Giảng viên: {course.instructorName}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200">
                        {course.behindRate.toFixed(0)}% trễ
                      </span>
                      <p className="text-[9px] text-gray-400 mt-0.5">{course.behindStudents}/{course.totalStudents} HV</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-12 text-sm">
                  Chưa có dữ liệu trễ tiến độ.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;