import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Book, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  PlayCircle, 
  DollarSign, 
  Star, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { fetchDashboardStats } from '../../features/instructor/instructorSlice';

const StatCard = ({ icon: Icon, label, value, growth, color, bgColor, formatType }) => {
  const isPositive = growth >= 0;
  const growthText = growth !== undefined && growth !== null && !isNaN(growth)
    ? `${isPositive ? '+' : ''}${growth.toFixed(1)}%` 
    : null;

  const displayValue = formatType === 'currency' 
    ? `${Number(value || 0).toLocaleString("vi-VN")} đ`
    : formatType === 'percentage' 
      ? `${Number(value || 0).toFixed(1)}%`
      : formatType === 'rating'
        ? `${Number(value || 0).toFixed(1)} / 5`
        : value || 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md hover:scale-[1.01] relative overflow-hidden group">
      <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-rose-50 to-transparent rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColor} ${color}`}>
          <Icon size={24} />
        </div>
        {growthText && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {growthText}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">{displayValue}</h3>
      </div>
    </div>
  );
};

const InstructorDashboard = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [activeChartTab, setActiveChartTab] = useState('revenue');
  
  const dispatch = useDispatch();
  const { dashboardData, isLoading } = useSelector((state) => state.instructor);

  useEffect(() => {
    dispatch(fetchDashboardStats(timeRange));
  }, [dispatch, timeRange]);

  const stats = dashboardData?.stats;
  const recentCourses = dashboardData?.recentCourses || [];
  const chartData = dashboardData?.chartData || [];
  const coursePerformance = dashboardData?.coursePerformance || [];

  const timeFilters = [
    { value: '7days', label: '7 ngày qua' },
    { value: '30days', label: '30 ngày qua' },
    { value: 'all', label: 'Toàn thời gian' }
  ];

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-8 animate-pulse text-left p-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-2xl"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left p-2">
      
      {/* Tiêu đề & Bộ lọc thời gian */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bảng điều khiển Giảng viên</h1>
          <p className="text-sm text-gray-500 mt-1">Phân tích chuyên sâu về doanh thu, lượt đăng ký và hiệu suất học tập.</p>
        </div>
        
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit self-start sm:self-auto">
          {timeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTimeRange(filter.value)}
              className={`px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all ${
                timeRange === filter.value
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          label={timeRange === 'all' ? 'Tổng doanh thu' : 'Doanh thu chu kỳ'}
          value={stats?.revenue || 0}
          growth={stats?.growth?.revenue}
          color="text-rose-600"
          bgColor="bg-rose-50"
          formatType="currency"
        />
        <StatCard
          icon={Users}
          label={timeRange === 'all' ? 'Tổng lượt đăng ký' : 'Lượt đăng ký mới'}
          value={stats?.enrollments || 0}
          growth={stats?.growth?.enrollments}
          color="text-blue-600"
          bgColor="bg-blue-50"
          formatType="number"
        />
        <StatCard
          icon={Star}
          label="Đánh giá trung bình"
          value={stats?.rating || 0}
          color="text-amber-500"
          bgColor="bg-amber-50"
          formatType="rating"
        />
        <StatCard
          icon={Percent}
          label="Tỷ lệ chuyển đổi"
          value={stats?.conversionRate || 0}
          growth={stats?.growth?.conversion}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          formatType="percentage"
        />
      </div>

      {/* Profile CTA */}
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 p-6 rounded-2xl border border-rose-100/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-rose-500" />
            Hồ sơ giảng viên của bạn
          </h3>
          <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin giảng dạy, kinh nghiệm và liên kết mạng xã hội để thu hút nhiều học viên hơn.</p>
        </div>
        <Link
          to="/instructor/profile/settings/edit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-md shadow-rose-200 hover:shadow-lg w-full sm:w-auto"
        >
          Cập nhật hồ sơ
        </Link>
      </div>

      {/* Biểu đồ xu hướng (Recharts) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Biểu đồ phân tích xu hướng</h3>
            <p className="text-xs text-gray-500 mt-0.5">Biểu diễn tăng trưởng doanh thu và học viên đăng ký mới</p>
          </div>
          
          <div className="flex gap-1 border-b border-gray-100 pb-1 sm:border-0 sm:pb-0">
            <button
              onClick={() => setActiveChartTab('revenue')}
              className={`px-4 py-2 text-xs lg:text-sm font-bold border-b-2 transition-all ${
                activeChartTab === 'revenue'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Doanh thu
            </button>
            <button
              onClick={() => setActiveChartTab('enrollments')}
              className={`px-4 py-2 text-xs lg:text-sm font-bold border-b-2 transition-all ${
                activeChartTab === 'enrollments'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Lượng ghi danh
            </button>
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            activeChartTab === 'revenue' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => val === 0 ? '0' : `${(val / 1000).toLocaleString()}k`} 
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} đ`, "Doanh thu"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [value, "Lượt ghi danh"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar dataKey="enrollments" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium">
              Không có dữ liệu xu hướng trong khoảng thời gian này
            </div>
          )}
        </div>
      </div>

      {/* Bảng hiệu suất khóa học (Course Performance Table) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50/30">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center">
              <Sparkles className="mr-2 text-rose-500" size={20} />
              Hiệu suất khóa học chi tiết
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">So sánh chi tiết lượng ghi danh mới và doanh thu giữa các khóa học</p>
          </div>
          <Link
            to="/instructor/courses"
            className="text-rose-600 text-xs lg:text-sm font-bold flex items-center hover:text-rose-700 transition-colors w-fit"
          >
            Quản lý tất cả khóa học <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="py-4 px-6">Khóa học</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-right">Học viên (Chu kỳ này / Tổng)</th>
                <th className="py-4 px-6 text-right">Doanh thu (Chu kỳ này / Tổng)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coursePerformance.length > 0 ? (
                coursePerformance.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6 flex items-center gap-4">
                      <img
                        src={course.thumbnail || "/src/assets/img/course-placeholder.png"}
                        className="w-16 h-11 object-cover rounded-lg shadow-sm group-hover:scale-[1.03] transition-transform"
                        alt={course.title}
                      />
                      <div className="min-w-0">
                        <Link 
                          to={`/instructor/courses/${course.slug}/edit`}
                          className="font-bold text-gray-900 truncate hover:text-rose-600 block transition-colors text-sm"
                        >
                          {course.title}
                        </Link>
                        <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                          <Star size={12} fill="currentColor" />
                          <span className="font-semibold">{Number(course.rating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        course.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : course.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-900 text-sm">
                      <span className="text-rose-600 font-extrabold">{course.periodStudentsCount}</span>
                      <span className="text-gray-400 font-normal"> / {course.studentsCount}</span>
                    </td>
                    <td className="py-4 px-6 text-right text-sm">
                      <div className="text-rose-600 font-extrabold">{Number(course.periodRevenue || 0).toLocaleString("vi-VN")} đ</div>
                      <div className="text-[11px] text-gray-400 font-medium">Tổng: {Number(course.revenue || 0).toLocaleString("vi-VN")} đ</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-16 text-center">
                    <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                      <Book className="text-gray-300" size={40} />
                    </div>
                    <p className="text-gray-500 font-medium">Chưa có khóa học nào được tạo.</p>
                    <Link to="/instructor/add-course" className="mt-4 inline-block text-rose-600 font-bold hover:underline">
                      Tạo khóa học ngay
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default InstructorDashboard;