import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCourseDetails, resetCourse } from '../features/course/courseSlice';

// Import các component con
import Breadcrumb from '../components/common/Breadcrumb';
import CourseHeader from '../components/course/CourseHeader';
import CourseSidebar from '../components/course/CourseSidebar';
import CourseContent from '../components/course/CourseContent';
import Spinner from '../components/common/Spinner';

const CourseDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();

  // Lấy state từ Redux store
  const { course, reviews, reviewCount, isLoading, isError, message } = useSelector(
    (state) => state.course
  );

  useEffect(() => {
    if (isError) {
      console.error(message);
    }

    // Gọi thunk để lấy dữ liệu
    dispatch(getCourseDetails(slug));

    // Cleanup: Reset state khi rời khỏi trang
    return () => {
      dispatch(resetCourse());
    };
  }, [slug, dispatch, isError, message]);

  // Xử lý trạng thái Loading
  if (isLoading || !course) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
        <p>Loading course...</p>
      </div>
    );
  }

  // Xử lý trạng thái Lỗi
  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Lỗi: {message || 'Không thể tải khóa học.'}</p>
      </div>
    );
  }

  // Render giao diện
  return (
    <>
      {/* <Breadcrumb title="Course Detail" /> */}

      {/* */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">

          {/* Header lớn ở trên (file bạn đã có) */}
          <CourseHeader course={course} reviewCount={reviewCount} />

          <div className="flex flex-wrap lg:flex-nowrap mt-8 -mx-4">

            {/* Cột chính bên trái (lg:w-8/12) */}
            <div className="w-full lg:w-2/3 px-4">
              <CourseContent course={course} reviews={reviews} />
            </div>

            {/* Cột sidebar bên phải (lg:w-4/12) */}
            <div className="w-full lg:w-1/3 px-4">
              <CourseSidebar course={course} />
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default CourseDetail;