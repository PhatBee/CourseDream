import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudentDashboard } from '../features/enrollment/enrollmentSlice'; // Giả sử bạn đã có thunk này
import LearningCourseCard from '../components/dashboard/LearningCourseCard';
import { BookOpen, Clock, Award } from 'lucide-react';
import Spinner from '../components/common/Spinner';

// Component con: Thẻ thống kê nhỏ
const StatBadge = ({ icon, label, value, color }) => (
  <div className={`flex items-center p-4 rounded-xl border border-gray-100 ${color} bg-opacity-10`}>
    <div className={`p-3 rounded-full ${color} text-white mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchStudentDashboard());
  }, [dispatch]);

  const { dashboardCourses, isLoading } = useSelector((state) => state.enrollment); // Cần đảm bảo slice có state này
  const { user } = useSelector((state) => state.auth);

  const enrolledCourses = dashboardCourses
  console.log(enrolledCourses)
  

  if (isLoading) {
    return <div className="flex h-64 justify-center items-center"><Spinner /></div>;
  }

  // Tính toán thống kê nhanh
  const totalCourses = enrolledCourses?.length || 0;
  const completedCourses = enrolledCourses?.filter(item => item.learningProgress?.percentage === 100).length || 0;
  const inProgressCourses = totalCourses - completedCourses;

  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-gray-500">Welcome back, <span className="font-semibold text-gray-900">{user?.name}</span>! Ready to learn something new?</p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatBadge 
            icon={<BookOpen size={20} />} 
            label="Enrolled Courses" 
            value={totalCourses} 
            color="bg-blue-500" 
          />
          <StatBadge 
            icon={<Clock size={20} />} 
            label="In Progress" 
            value={inProgressCourses} 
            color="bg-yellow-500" 
          />
          <StatBadge 
            icon={<Award size={20} />} 
            label="Completed" 
            value={completedCourses} 
            color="bg-green-500" 
          />
        </div>
      </div>

      {/* 2. Course In Progress Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xl font-bold text-gray-800">My Learning</h3>
           {/* Có thể thêm Filter: All / In Progress / Completed */}
        </div>
        
        <div className="space-y-4">
          {enrolledCourses && enrolledCourses.length > 0 ? (
            enrolledCourses.map((enrollment) => (
              <LearningCourseCard key={enrollment._id} enrollment={enrollment} />
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
              <a href="/courses" className="text-rose-600 font-bold hover:underline">Browse Courses</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;