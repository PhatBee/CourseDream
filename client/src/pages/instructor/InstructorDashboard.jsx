import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Book, Users, TrendingUp, ArrowRight, PlayCircle } from 'lucide-react';
import { fetchDashboardStats } from '../../features/instructor/instructorSlice';

const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center transition-transform hover:scale-[1.02]">
    <div className={`p-4 rounded-xl ${bgColor} ${color} mr-5`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-tight">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const InstructorDashboard = () => {
  const dispatch = useDispatch();
  const { dashboardData, isLoading } = useSelector((state) => state.instructor);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const stats = dashboardData?.stats;
  const recentCourses = dashboardData?.recentCourses || [];

  if (isLoading && !dashboardData) return <div className="p-10 text-center">Loading statistics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Instructor Dashboard</h2>
        <p className="text-gray-500">Welcome back! Here's what's happening with your courses today.</p>
      </div>

      {/* 1. Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Book} 
          label="Total Courses" 
          value={stats?.totalCourses || 0} 
          color="text-blue-600" 
          bgColor="bg-blue-50"
        />
        <StatCard 
          icon={Users} 
          label="Total Students" 
          value={stats?.totalStudents || 0} 
          color="text-purple-600" 
          bgColor="bg-purple-50"
        />
        <StatCard 
          icon={TrendingUp} 
          label="New Enrollments (Today)" 
          value={stats?.todayEnrollments || 0} 
          color="text-emerald-600" 
          bgColor="bg-emerald-50"
        />
      </div>

      {/* 2. Khóa học gần đây */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-lg flex items-center">
            <PlayCircle className="mr-2 text-rose-500" size={20} />
            Recently Updated Courses
          </h3>
          <Link 
            to="/profile/instructor/courses" 
            className="text-rose-600 text-sm font-bold flex items-center hover:text-rose-700 transition-colors"
          >
            See Your Courses <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {recentCourses.length > 0 ? (
            recentCourses.map((course) => (
              <Link
                key={course._id}
                to={`/instructor/courses/${course.slug}/edit`}
                className="block"
              >
              <div key={course._id} className="p-5 flex items-center hover:bg-gray-50 transition-all group">
                <img 
                  src={course.thumbnail || "/src/assets/img/course-placeholder.png"} 
                  className="w-20 h-14 object-cover rounded-lg shadow-sm mr-5 group-hover:ring-2 ring-rose-100 transition-all" 
                  alt={course.title}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate group-hover:text-rose-600 transition-colors">
                    {course.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-1.5">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      course.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {course.status}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center font-medium">
                      <Users size={13} className="mr-1.5 text-gray-400" /> {course.studentsCount} Students
                    </span>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-gray-900 text-lg">
                    {course.price === 0 ? "Free" : `${Number(course.price).toLocaleString("vi-VN")} VNĐ`}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Updated: {new Date(course.updatedAt || course.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              </Link>
            ))
          ) : (
            <div className="p-16 text-center">
              <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                <Book className="text-gray-300" size={40} />
              </div>
              <p className="text-gray-500 font-medium">No courses found. Start creating your first course!</p>
              <Link to="/instructor/add-course" className="mt-4 inline-block text-rose-600 font-bold hover:underline">
                Create a Course
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;