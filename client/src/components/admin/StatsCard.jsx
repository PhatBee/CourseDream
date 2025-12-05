import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium flex items-center ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
      <div className={`p-4 rounded-full ${color} bg-opacity-10 text-white`}>
        {/* Chúng ta sẽ truyền class màu text vào icon thay vì bg */}
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  );
};

export default StatsCard;