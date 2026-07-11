import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
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
  Tooltip,
  Legend
} from 'recharts';
import { fetchDashboardStats } from '../../features/instructor/instructorSlice';
import { getCourseStudents, sendStudyReminder } from '../../features/course/courseSlice';

const StatCard = ({ icon: Icon, label, value, growth, color, bgColor, formatType, subtext }) => {
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
          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {growthText}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">{displayValue}</h3>
        {subtext && (
          <p className="text-[10px] text-gray-400 mt-2 italic font-medium leading-relaxed">{subtext}</p>
        )}
      </div>
    </div>
  );
};

const InstructorDashboard = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [activeChartTab, setActiveChartTab] = useState('revenue');
  const [activeTableTab, setActiveTableTab] = useState('revenue');

  // States cho modal chi tiết tiến độ học viên
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStatus, setModalStatus] = useState('');
  const [modalCourseId, setModalCourseId] = useState('');
  const [modalPage, setModalPage] = useState(1);

  // Trạng thái đang gửi nhắc nhở cho từng khóa học
  const [sendingReminder, setSendingReminder] = useState({});

  const dispatch = useDispatch();
  const { dashboardData, isLoading } = useSelector((state) => state.instructor);

  // Lấy dữ liệu học viên từ courseSlice
  const { courseStudents, courseStudentsPagination, isStudentsLoading } = useSelector((state) => state.course);

  // Fetch danh sách học viên kèm phân trang và lọc theo trạng thái
  const fetchStudentsList = async (courseId, status, page = 1) => {
    setIsStudentModalOpen(true);
    setModalCourseId(courseId);
    setModalStatus(status);
    setModalPage(page);
    setModalTitle(status === 'behind' ? 'Học viên trễ tiến độ (Behind Schedule)' : 'Học viên đã hoàn thành khóa học');

    dispatch(getCourseStudents({
      courseId,
      params: { scheduleStatus: status, page, limit: 5 }
    }));
  };

  // API nhắc nhở học viên trễ của khóa học thật
  const handleSendReminder = async (courseId, courseTitle) => {
    setSendingReminder(prev => ({ ...prev, [courseId]: true }));
    try {
      const resultAction = await dispatch(sendStudyReminder(courseId));
      if (sendStudyReminder.fulfilled.match(resultAction)) {
        const message = resultAction.payload?.data?.message || resultAction.payload?.message || `Đã gửi thông báo nhắc nhở thành công!`;
        toast.success(message);
      } else {
        toast.error(resultAction.payload || "Không thể gửi thông báo nhắc nhở.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi thông báo nhắc nhở.");
    } finally {
      setSendingReminder(prev => ({ ...prev, [courseId]: false }));
    }
  };

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
              className={`px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all ${timeRange === filter.value
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
          label={timeRange === 'all' ? 'Doanh thu thực nhận' : 'Doanh thu thực nhận chu kỳ'}
          value={stats?.revenue || 0}
          growth={stats?.growth?.revenue}
          color="text-rose-600"
          bgColor="bg-rose-50"
          formatType="currency"
          subtext="Doanh thu tính trên giá trị khóa học sau giảm giá và đã khấu trừ 10% VAT"
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

      {/* Phân nhóm dòng tiền Doanh thu */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-gray-100 pr-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Quản lý dòng tiền</h3>
            <p className="text-xs text-gray-500 mt-1">Phân tích chuyên sâu nguồn tiền từ học viên đăng ký mới và các lượt gia hạn khóa học học tập dài hạn (LTV).</p>
          </div>
          <div className="mt-4 p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 block mb-1">Định hướng Udemy</span>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tỷ lệ gia hạn cao chứng tỏ nội dung của bạn có giá trị bền vững và giữ chân học viên tốt. Hãy liên tục cập nhật bài giảng mới để tối ưu dòng tiền gia hạn!
            </p>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card Bán khóa học */}
          <div className="bg-gradient-to-br from-rose-50/30 to-rose-50/10 p-5 rounded-2xl border border-rose-100/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-16 h-16 bg-rose-100/30 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full">Bán khóa học (Purchase)</span>
              <DollarSign className="text-rose-500" size={20} />
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Chu kỳ hiện tại</span>
              <h4 className="text-2xl font-black text-gray-900 mt-1">
                {Number(stats?.purchaseRevenue || 0).toLocaleString("vi-VN")} đ
              </h4>
              <p className="text-[11px] text-gray-450 mt-1.5 pt-1.5 border-t border-blue-100/30">
                Lũy kế toàn thời gian: <strong className="text-gray-700 font-extrabold">{Number(stats?.allTimePurchaseRevenue || 0).toLocaleString("vi-VN")} đ</strong>
              </p>
            </div>
          </div>

          {/* Card Gia hạn khóa học */}
          <div className="bg-gradient-to-br from-purple-50/30 to-purple-50/10 p-5 rounded-2xl border border-purple-100/60 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-16 h-16 bg-purple-100/30 rounded-bl-full pointer-events-none"></div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">Gia hạn (Extension)</span>
              <DollarSign className="text-purple-500" size={20} />
            </div>
            <div className="mt-4">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Chu kỳ hiện tại</span>
              <h4 className="text-2xl font-black text-gray-900 mt-1">
                {Number(stats?.extensionRevenue || 0).toLocaleString("vi-VN")} đ
              </h4>
              <p className="text-[11px] text-gray-450 mt-1.5 pt-1.5 border-t border-purple-100/30">
                Lũy kế toàn thời gian: <strong className="text-gray-700 font-extrabold">{Number(stats?.allTimeExtensionRevenue || 0).toLocaleString("vi-VN")} đ</strong>
              </p>
            </div>
          </div>
        </div>
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

          <div className="flex gap-1 border-b border-gray-100 pb-1 sm:border-0 sm:pb-0 overflow-x-auto">
            <button
              onClick={() => setActiveChartTab('revenue')}
              className={`px-3 py-2 text-xs lg:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeChartTab === 'revenue'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-450 hover:text-gray-700'
                }`}
            >
              Doanh thu tổng hợp
            </button>
            <button
              onClick={() => setActiveChartTab('purchaseRevenue')}
              className={`px-3 py-2 text-xs lg:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeChartTab === 'purchaseRevenue'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-450 hover:text-gray-700'
                }`}
            >
              Bán khóa học
            </button>
            <button
              onClick={() => setActiveChartTab('extensionRevenue')}
              className={`px-3 py-2 text-xs lg:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeChartTab === 'extensionRevenue'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-450 hover:text-gray-700'
                }`}
            >
              Gia hạn
            </button>
            <button
              onClick={() => setActiveChartTab('enrollments')}
              className={`px-3 py-2 text-xs lg:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${activeChartTab === 'enrollments'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-gray-450 hover:text-gray-700'
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
                    <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF1D8D" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF1D8D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExtension" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9945FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#9945FF" stopOpacity={0} />
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
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString("vi-VN")} đ`,
                      name === 'purchaseRevenue' ? 'Bán khóa học' : name === 'extensionRevenue' ? 'Gia hạn' : 'Doanh thu'
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area type="monotone" dataKey="purchaseRevenue" name="Bán khóa học" stroke="#FF1D8D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPurchase)" />
                  <Area type="monotone" dataKey="extensionRevenue" name="Gia hạn" stroke="#9945FF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExtension)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : activeChartTab === 'purchaseRevenue' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPurchaseOnly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF1D8D" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF1D8D" stopOpacity={0} />
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
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} đ`, "Bán khóa học"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Area type="monotone" dataKey="purchaseRevenue" stroke="#FF1D8D" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchaseOnly)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : activeChartTab === 'extensionRevenue' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExtensionOnly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9945FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#9945FF" stopOpacity={0} />
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
                    formatter={(value) => [`${Number(value).toLocaleString("vi-VN")} đ`, "Gia hạn"]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Area type="monotone" dataKey="extensionRevenue" stroke="#9945FF" strokeWidth={3} fillOpacity={1} fill="url(#colorExtensionOnly)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(value, name) => [
                      value,
                      name === 'purchaseEnrollments' ? 'Ghi danh bán khóa học' : name === 'extensionEnrollments' ? 'Ghi danh gia hạn' : 'Lượng ghi danh'
                    ]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="purchaseEnrollments" name="Bán mới" fill="#FF1D8D" stackId="enrollments" radius={[0, 0, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="extensionEnrollments" name="Gia hạn" fill="#9945FF" stackId="enrollments" radius={[4, 4, 0, 0]} maxBarSize={40} />
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start">
              <button
                onClick={() => setActiveTableTab('revenue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTableTab === 'revenue' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                Doanh thu & Học viên
              </button>
              <button
                onClick={() => setActiveTableTab('retention')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTableTab === 'retention' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                Retention & Tiến độ
              </button>
            </div>
            <Link
              to="/instructor/courses"
              className="text-rose-600 text-xs lg:text-sm font-bold flex items-center hover:text-rose-700 transition-colors w-fit self-end sm:self-auto"
            >
              Quản lý tất cả khóa học <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              {activeTableTab === 'revenue' ? (
                <tr className="bg-gray-50 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Khóa học</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Học viên (Chu kỳ này / Tổng)</th>
                  <th className="py-4 px-6 text-right">Doanh thu (Chu kỳ này / Tổng)</th>
                </tr>
              ) : (
                <tr className="bg-gray-50 text-gray-400 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-4 px-6">Khóa học</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Tiến độ trung bình</th>
                  <th className="py-4 px-6 text-right">Học viên trễ tiến độ (Behind)</th>
                  <th className="py-4 px-6 text-right">Học viên hoàn thành</th>
                  <th className="py-4 px-6 text-center">Hành động</th>
                </tr>
              )}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${course.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : course.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}>
                        {course.status}
                      </span>
                    </td>

                    {activeTableTab === 'revenue' ? (
                      <>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900 text-sm">
                          <span className="text-rose-600 font-extrabold">{course.periodStudentsCount}</span>
                          <span className="text-gray-400 font-normal"> / {course.studentsCount}</span>
                        </td>
                        <td className="py-4 px-6 text-right text-sm">
                          <div className="text-rose-600 font-extrabold">{Number(course.periodRevenue || 0).toLocaleString("vi-VN")} đ</div>
                          {(course.periodPurchaseRevenue > 0 || course.periodExtensionRevenue > 0) && (
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                              Mua: {Number(course.periodPurchaseRevenue || 0).toLocaleString("vi-VN")} đ | Hạn: {Number(course.periodExtensionRevenue || 0).toLocaleString("vi-VN")} đ
                            </div>
                          )}
                          <div className="text-[11px] text-gray-500 font-bold mt-1.5">Tổng: {Number(course.revenue || 0).toLocaleString("vi-VN")} đ</div>
                          {(course.purchaseRevenue > 0 || course.extensionRevenue > 0) && (
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                              Mua: {Number(course.purchaseRevenue || 0).toLocaleString("vi-VN")} đ | Hạn: {Number(course.extensionRevenue || 0).toLocaleString("vi-VN")} đ
                            </div>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 text-right text-sm">
                          <div className="font-extrabold text-gray-900">{(course.avgCompletionPercentage || 0).toFixed(1)}%</div>
                          <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden ml-auto mt-1">
                            <div className="bg-rose-500 h-full" style={{ width: `${course.avgCompletionPercentage || 0}%` }}></div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-sm">
                          {course.behindStudentsCount > 0 ? (
                            <button
                              onClick={() => fetchStudentsList(course._id, 'behind', 1)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all border border-amber-200"
                            >
                              ⚠️ {course.behindStudentsCount} học viên
                            </button>
                          ) : (
                            <span className="text-gray-400">0 học viên</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right text-sm font-semibold">
                          {course.completedStudentsCount > 0 ? (
                            <button
                              onClick={() => fetchStudentsList(course._id, 'completed', 1)}
                              className="text-green-600 bg-green-50 hover:bg-green-100 transition-all px-3 py-1 rounded-full border border-green-200"
                            >
                              {course.completedStudentsCount} học viên
                            </button>
                          ) : (
                            <span className="text-gray-400">0 học viên</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center text-sm">
                          <button
                            onClick={() => handleSendReminder(course._id, course.title)}
                            disabled={!course.behindStudentsCount || sendingReminder[course._id]}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${course.behindStudentsCount
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              }`}
                          >
                            {sendingReminder[course._id] ? "Đang gửi..." : "Nhắc nhở học bù"}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTableTab === 'revenue' ? "4" : "6"} className="py-16 text-center">
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

      {/* Modal hiển thị danh sách học viên */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100 text-left">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{modalTitle}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Danh sách chi tiết tiến độ thực tế của học viên</p>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="p-1.5 hover:bg-gray-150 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[400px] overflow-y-auto min-h-[150px] flex flex-col justify-center">
              {isStudentsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                </div>
              ) : courseStudents.length > 0 ? (
                <div className="space-y-4">
                  {courseStudents.map((item) => (
                    <div key={item.student?._id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-all">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.student?.avatar || '/src/assets/img/avatar-placeholder.png'}
                          onError={(e) => { e.target.src = '/src/assets/img/avatar-placeholder.png' }}
                          className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                          alt={item.student?.name}
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{item.student?.name || 'Chưa đặt tên'}</h4>
                          {/* <p className="text-xs text-gray-400">{item.student?.email}</p> */}
                          {/* Không lộ email ở đây nha */}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-rose-600">{(item.progress?.percentage || 0).toFixed(0)}%</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Tiến độ thực tế</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-10">
                  Chưa có học viên nào ở trạng thái này.
                </div>
              )}
            </div>

            {/* Footer & Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="text-xs text-gray-500 font-medium">Trang {courseStudentsPagination.page || 1} / {courseStudentsPagination.totalPages || 1}</span>
              <div className="flex gap-2">
                <button
                  disabled={(courseStudentsPagination.page || 1) <= 1 || isStudentsLoading}
                  onClick={() => fetchStudentsList(modalCourseId, modalStatus, (courseStudentsPagination.page || 1) - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Trước
                </button>
                <button
                  disabled={(courseStudentsPagination.page || 1) >= (courseStudentsPagination.totalPages || 1) || isStudentsLoading}
                  onClick={() => fetchStudentsList(modalCourseId, modalStatus, (courseStudentsPagination.page || 1) + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Tiếp theo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InstructorDashboard;