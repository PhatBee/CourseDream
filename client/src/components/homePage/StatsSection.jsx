import React from 'react';

const StatsSection = () => {
  // Nếu bạn có API lấy thống kê hệ thống thì gọi ở đây, tạm thời dùng số tĩnh
  const stats = [
    { count: '10K', label: 'Online Courses', icon: '📚' },
    { count: '200K', label: 'Expert Tutors', icon: '👨‍🏫' },
    { count: '6K', label: 'Certified Courses', icon: '🎓' },
    { count: '60K', label: 'Online Students', icon: '👥' },
  ];

  return (
    <div className="bg-white py-12 shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-4 justify-center transform hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-2xl">
                {stat.icon}
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">{stat.count}</h4>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;