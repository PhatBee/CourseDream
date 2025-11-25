import React from 'react';
import CourseCard from '../common/CourseCard';
import { useSelector } from 'react-redux';

const CourseList = ({ courses, viewMode }) => {
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className={`
      grid gap-6 animate-fadeIn
      ${viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
        : 'grid-cols-1' // List view luôn là 1 cột
      }
    `}>
      {courses.map((course) => {
        const isLiked = wishlistItems.some(item => item._id === course._id);
        
        return (
          <CourseCard 
            key={course._id} 
            course={course} 
            isLiked={isLiked}
            viewMode={viewMode} // Truyền viewMode xuống để Card tự đổi kiểu
          />
        );
      })}
    </div>
  );
};

export default CourseList;