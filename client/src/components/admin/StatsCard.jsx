import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  // Logic xử lý màu sắc icon dựa trên prop color (VD: 'bg-rose-500' -> 'text-rose-500')
  const iconColorClass = color.replace('bg-', 'text-');
  const bgOpacityClass = color.replace('500', '50'); // Tạo nền nhạt

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        
        {/* Trend Indicator (Optional) */}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-xs text-gray-400 ml-2">vs last month</span>
          </div>
        )}
      </div>
      
      {/* Icon Container */}
      <div className={`p-4 rounded-xl ${bgOpacityClass}`}>
        <Icon size={28} className={iconColorClass} />
      </div>
    </div>
  );
};

export default StatsCard;