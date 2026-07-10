import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyEnrollments } from "../features/enrollment/enrollmentSlice";
import CourseList from "../components/course/CourseList";

const EnrolledCoursesPage = () => {
  const dispatch = useDispatch();
  const { items: enrollments, isLoading } = useSelector((state) => state.enrollment);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  // Lọc bỏ enrollment không có course và đính kèm thông tin kích hoạt
  const courses = enrollments
    .map((e) => {
      if (!e.course) return null;
      return {
        ...e.course,
        enrollmentId: e._id,
        isActivated: e.isActivated,
        startedAt: e.startedAt,
        endedAt: e.endedAt,
        isEnrolled: true,
      };
    })
    .filter(Boolean);

  return (
    <div className="container py-6">
      <h2 className="text-2xl font-bold mb-4">Khóa học đã mua</h2>
      {isLoading && courses.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Đang tải...</div>
      ) : (
        <CourseList courses={courses} viewMode="grid" />
      )}
    </div>
  );
};

export default EnrolledCoursesPage;