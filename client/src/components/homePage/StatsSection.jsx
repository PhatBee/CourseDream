import React from 'react';
import { BookOpen, UserCheck, Award, Users } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    { count: '10K', label: 'Online Courses', icon: <BookOpen size={28} />, color: 'bg-rose-100 text-rose-600' },
    { count: '200K', label: 'Expert Tutors', icon: <UserCheck size={28} />, color: 'bg-blue-100 text-blue-600' },
    { count: '6K', label: 'Certified Courses', icon: <Award size={28} />, color: 'bg-orange-100 text-orange-600' },
    { count: '60K', label: 'Online Students', icon: <Users size={28} />, color: 'bg-teal-100 text-teal-600' },
  ];

  return (
    <div className="relative -mt-16 z-20 pb-16">
      {/* Sử dụng cùng cấu trúc container với Hero để thẳng hàng lề trái */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-100 border border-gray-50 flex items-center gap-5 transform hover:-translate-y-1 transition-all duration-300">
              <div className={`w-16 h-16 ${stat.color} rounded-full flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <h4 className="text-3xl font-extrabold text-gray-900">{stat.count}</h4>
                <p className="text-gray-500 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsSection;