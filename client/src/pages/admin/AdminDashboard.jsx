import React from 'react';
import StatsCard from '../../components/admin/StatsCard';
import { BookOpen, Users, DollarSign, UserCheck } from 'lucide-react';

const AdminDashboard = () => {
  // Dữ liệu giả (Sau này sẽ gọi API)
  const stats = [
    { title: 'Total Students', value: '4,532', icon: Users, color: 'bg-blue-500', trend: 12 },
    { title: 'Total Instructors', value: '128', icon: UserCheck, color: 'bg-green-500', trend: 5 },
    { title: 'Courses Published', value: '67', icon: BookOpen, color: 'bg-orange-500', trend: -2 },
    { title: 'Total Revenue', value: '$750,000', icon: DollarSign, color: 'bg-rose-500', trend: 10.3 },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
        <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm">
          + Create Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Chart Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái (Biểu đồ lớn) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Analytics</h3>
          <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
            Chart Component Here (Recharts / Chart.js)
          </div>
        </div>

        {/* Cột phải (Danh sách nhỏ) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top Courses</h3>
          <ul className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">UI/UX Design</p>
                    <p className="text-xs text-gray-500">485 sales</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-rose-600">$120</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;