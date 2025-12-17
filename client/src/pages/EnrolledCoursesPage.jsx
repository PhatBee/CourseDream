import React, { useEffect, useState } from "react";
import enrollmentApi from "../api/enrollmentApi";
import CourseList from "../components/course/CourseList";

const EnrolledCoursesPage = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    enrollmentApi.getMyEnrollments().then(res => {
      // Lọc bỏ enrollment không có course
      setCourses(res.data.enrollments.map(e => e.course).filter(Boolean));
    });
  }, []);

  return (
    <div className="container py-6">
      <h2 className="text-2xl font-bold mb-4">Khóa học đã mua</h2>
      <CourseList courses={courses} viewMode="grid" />
    </div>
  );
};

export default EnrolledCoursesPage;