import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import CourseCard from '../common/CourseCard';
import Spinner from '../common/Spinner';

const FeaturedCourses = () => {
  const { items: courses, isLoading } = useSelector((state) => state.course);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Fallback nếu chưa có dữ liệu
  const featuredCourses = courses?.slice(0, 3) || []; 

  if (isLoading) {
     return <div className="py-20 flex justify-center"><Spinner /></div>;
  }

  return (
    <section className="py-24 bg-white">
      {/* Đồng bộ max-w-7xl */}
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header Căn Trái - Phải */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div className="text-left">
            <span className="text-rose-500 font-bold text-sm uppercase tracking-wider block mb-2">What’s New</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Trending Courses</h2>
          </div>
          <Link 
            to="/courses" 
            className="bg-rose-600 text-white px-8 py-3 rounded-full font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
          >
            View all Courses
          </Link>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => {
               const isLiked = wishlistItems.some(item => item._id === course._id);
               return (
                <CourseCard 
                  key={course._id} 
                  course={course} 
                  isLiked={isLiked}
                />
               );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500">No courses available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;