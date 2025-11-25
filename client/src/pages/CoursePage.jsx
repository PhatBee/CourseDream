import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCourses } from '../features/course/courseSlice';
import { addToWishlist, removeFromWishlist } from '../features/wishlist/wishlistSlice'; // Import action wishlist

import CourseFilter from '../components/course/CourseFilter';
import CourseListHeader from '../components/course/CourseListHeader';
import CourseCard from '../components/common/CourseCard';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';

const CoursePage = () => {
  const dispatch = useDispatch();
  
  // Lấy data từ Redux Store
  const { items: courses, isLoading, pagination } = useSelector((state) => state.course);
  const { items: wishlistItems } = useSelector((state) => state.wishlist); // Lấy wishlist để check trạng thái tim

  // State nội bộ cho UI
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dữ liệu khi vào trang hoặc đổi trang
  useEffect(() => {
    dispatch(getAllCourses({ page: currentPage, limit: 9 }));
    // Scroll lên đầu trang khi chuyển page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, currentPage]);

  // Xử lý Wishlist
  const handleToggleWishlist = (courseId) => {
     // Logic đã có sẵn trong CourseCard, nhưng nếu cần xử lý gì thêm ở đây thì viết
     // CourseCard đang dispatch trực tiếp rồi, nên hàm này có thể để trống hoặc log
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Breadcrumb (Optional) */}
        {/* <div className="mb-8 text-sm text-gray-500">Home / Courses</div> */}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- LEFT SIDEBAR (FILTER) --- */}
          <div className="w-full lg:w-1/4 flex-shrink-0">
             {/* Ẩn trên mobile, hiện nút toggle sau này nếu cần */}
             <div className="sticky top-24">
               <CourseFilter />
             </div>
          </div>

          {/* --- RIGHT CONTENT (LIST) --- */}
          <div className="w-full lg:w-3/4">
            
            <CourseListHeader 
              totalCourses={pagination.total} 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
            />

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner />
              </div>
            ) : courses.length > 0 ? (
              <>
                {/* Course Grid/List Container */}
                <div className={`
                  grid gap-6
                  ${viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                    : 'grid-cols-1' // List view: 1 cột
                  }
                `}>
                  {courses.map((course) => {
                    // Check xem khóa học đã được like chưa
                    const isLiked = wishlistItems.some(item => item._id === course._id);
                    
                    return (
                      <CourseCard 
                        key={course._id} 
                        course={course} 
                        isLiked={isLiked}
                        // Nếu viewMode là list, bạn có thể truyền thêm prop vào CourseCard để nó đổi style (nếu CourseCard hỗ trợ)
                        // className={viewMode === 'list' ? 'flex-row ...' : ''} 
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="mt-12">
                  <Pagination 
                    currentPage={pagination.page} 
                    totalPages={pagination.totalPages} 
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </>
            ) : (
              // Empty State
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-lg">No courses found matching your criteria.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 text-rose-500 font-medium hover:underline"
                >
                  Clear filters & Reload
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CoursePage;