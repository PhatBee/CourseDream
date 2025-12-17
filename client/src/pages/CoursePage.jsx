import React, { useEffect, useState } from 'react';
import { searchCourses } from '../api/courseApi';
import { useSearchParams } from "react-router-dom";
import CourseFilter from '../components/course/CourseFilter';
import CourseListHeader from '../components/course/CourseListHeader';
import CourseList from '../components/course/CourseList';
import Pagination from '../components/common/Pagination';
import Spinner from '../components/common/Spinner';
import { useSearchParams } from 'react-router-dom';

const buildParams = (filters, currentPage) => {
  const params = new URLSearchParams();
  if (filters.q) params.append('q', filters.q);
  if (filters.category && filters.category.length)
    filters.category.forEach(c => params.append('category', c));
  if (filters.instructor && filters.instructor.length)
    filters.instructor.forEach(i => params.append('instructor', i));
  if (filters.price && filters.price.length)
    filters.price.forEach(p => params.append('price', p));
  if (filters.level && filters.level.length)
    filters.level.forEach(l => params.append('level', l));
  params.append('page', currentPage);
  params.append('limit', 9);
  return params;
};

const CoursePage = () => {
  const [searchParams] = useSearchParams();

  const initialKeyword = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") ? [searchParams.get("category")] : [];

  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    q: initialQuery,
    category: [],
    instructor: [],
    price: [],
    level: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryInUrl = searchParams.get('q') || '';
    if (queryInUrl !== filters.q) {
      setFilters(prev => ({ ...prev, q: queryInUrl }));
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = buildParams(filters, currentPage);
    searchCourses(params)
      .then(res => {
        setCourses(res.data.courses || []);
        setPagination({
          page: res.data.page,
          totalPages: Math.ceil(res.data.total / 9),
          total: res.data.total
        });
      })
      .finally(() => setLoading(false));
  }, [filters, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang đầu khi filter
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- SIDEBAR FILTER --- */}
          <div className="w-full lg:w-1/4 flex-shrink-0">
            <div className="sticky top-24">
              <CourseFilter
                onFilterChange={handleFilterChange}
                initialKeyword={initialKeyword}
                initialCategory={initialCategory}
              />
            </div>
          </div>
          {/* --- MAIN CONTENT --- */}
          <div className="w-full lg:w-3/4">
            <CourseListHeader
              totalCourses={pagination.total}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner color="border-rose-500" />
              </div>
            ) : (
              <>
                <CourseList courses={courses} viewMode={viewMode} />
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