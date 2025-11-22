import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import CourseCard from '../common/CourseCard';
import Spinner from '../common/Spinner';

const FeaturedCourses = () => {
  const { items: courses, isLoading } = useSelector((state) => state.course);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const featuredCourses = courses?.slice(0, 6) || [];

  if (isLoading) {
     return <div className="py-16 flex justify-center"><Spinner /></div>;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-indigo-600 font-bold text-sm uppercase">What’s New</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Featured Courses</h2>
          </div>
          <Link to="/courses" className="hidden md:inline-block px-6 py-2 bg-indigo-100 text-indigo-600 rounded-full font-medium hover:bg-indigo-200 transition-colors">
            View all Courses
          </Link>
        </div>

        {featuredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => {
               // Logic check wishlist cho CourseCard
               const isLiked = wishlistItems.some(item => item._id === course._id);
               
               return (
                <CourseCard 
                  key={course._id} 
                  course={course} // Truyền toàn bộ object course thật vào
                  isLiked={isLiked}
                />
               );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500">No courses available at the moment.</p>
        )}
      </div>
    </section>
  );
};

export default FeaturedCourses;