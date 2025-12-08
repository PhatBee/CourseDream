import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import defaultAvatar from '../../../assets/img/auth/logo.svg';

const TopCoursesList = ({ courses }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full text-left">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Top Courses</h3>
        <Link 
          to="/admin/courses" 
          className="flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
        >
          See All <ArrowUpRight size={16} className="ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course._id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <img 
                src={course.thumbnail || defaultAvatar} 
                alt="" 
                className="w-10 h-10 rounded-lg object-cover bg-gray-100"
              />
              <div>
                <h4 className="text-sm font-semibold text-gray-800 line-clamp-1 w-40 group-hover:text-rose-600 transition-colors">
                  {course.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {course.studentsCount} sales
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
            </span>
          </div>
        ))}
        
        {courses.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">No data available</p>
        )}
      </div>
    </div>
  );
};

export default TopCoursesList;