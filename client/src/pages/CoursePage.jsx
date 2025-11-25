import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCourses } from '../features/course/courseSlice';

import CourseFilter from '../components/course/CourseFilter';
import CourseListHeader from '../components/course/CourseListHeader';
import CourseList from '../components/course/CourseList';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';

const CoursePage = () => {
  const dispatch = useDispatch();
  
  const { items: courses, isLoading, pagination } = useSelector((state) => state.course);

  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(getAllCourses({ page: currentPage, limit: 9 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [dispatch, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- SIDEBAR FILTER --- */}
          <div className="w-full lg:w-1/4 flex-shrink-0">
             <div className="sticky top-24">
               <CourseFilter />
             </div>
          </div>

          {/* --- MAIN CONTENT --- */}
          <div className="w-full lg:w-3/4">
            
            {/* Toolbar: Sort, View Mode, Result Count */}
            <CourseListHeader 
              totalCourses={pagination.total} 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
            />

            {/* Content Area */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner color="border-rose-500" />
              </div>
            ) : (
              <>
                {/* Danh sách khóa học */}
                <CourseList courses={courses} viewMode={viewMode} />

                {/* Phân trang */}
                <div className="mt-12">
                  <Pagination 
                    currentPage={pagination.page} 
                    totalPages={pagination.totalPages} 
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CoursePage;