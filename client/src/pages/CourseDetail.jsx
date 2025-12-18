import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCourseDetails, resetCourse } from '../features/course/courseSlice';
import { fetchMyEnrollments } from "../features/enrollment/enrollmentSlice";

// Import các component con
import Breadcrumb from '../components/common/Breadcrumb';
import CourseHeader from '../components/course/CourseHeader';
import CourseSidebar from '../components/course/CourseSidebar';
import CourseContent from '../components/course/CourseContent';
import Spinner from '../components/common/Spinner';
import CourseDiscussion from '../features/discussion/CourseDiscussion';

const CourseDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { discussions } = useSelector((state) => state.discussion);

  // Lấy state từ Redux store
  const { course, reviews, reviewCount, isLoading, isError, message } = useSelector(
    (state) => state.course
  );
  const user = useSelector((state) => state.auth.user);
  const enrolledCourseIds = useSelector((state) => state.enrollment.enrolledCourseIds);

  useEffect(() => {
    dispatch(getCourseDetails(slug));
    dispatch(fetchMyEnrollments());

    return () => {
      dispatch(resetCourse());
    };
  }, [slug, dispatch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const discussionId = params.get("discussionId");
    if (discussionId) {
      setTimeout(() => {
        const el = document.getElementById(`discussion-${discussionId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500); // delay để đảm bảo discussion đã render
    }
  }, [location.search, discussions]);

  // Xác định user đã ghi danh chưa
  const isEnrolled = enrolledCourseIds?.includes(String(course?._id));

  // Sửa đoạn này:
  let instructorId = null;
  if (course && course.instructor) {
    instructorId = typeof course.instructor === "object" ? course.instructor._id : course.instructor;
  }
  const isInstructor = user && instructorId && user._id === String(instructorId);

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

      <div className="container mx-auto px-4 max-w-7xl">
        <CourseDiscussion
          courseId={course._id}
          user={user}
          isEnrolled={isEnrolled}
          isInstructor={isInstructor}
        />
      </div>
    </>
  );
};

export default CourseDetail;