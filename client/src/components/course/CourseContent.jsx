import React, { useState, useEffect } from 'react';
import CourseOverview from './CourseOverview';
import CourseAccordion from './CourseAccordion';
import InstructorBio from './InstructorBio';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import { getReviews } from '../../api/reviewApi';

const CourseContent = ({ course }) => {
  const [reviews, setReviews] = useState([]);

  // Lấy review khi course thay đổi
  useEffect(() => {
    if (course?._id) {
      getReviews(course._id).then(res => setReviews(res.data || res));
    }
  }, [course?._id]);

  // Callback reload review sau khi gửi đánh giá
  const reloadReviews = () => {
    if (course?._id) {
      getReviews(course._id).then(res => setReviews(res.data || res));
    }
  };

  return (
    <div className="space-y-6"> 
      
      {/* Card 1: Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <CourseOverview course={course} />
        </div>
      </div>

      {/* Card 2: Course Content (Accordion) */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <CourseAccordion sections={course.sections} />
        </div>
      </div>

      {/* Card 3: Instructor Bio */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <InstructorBio instructor={course.instructor} />
        </div>
      </div>

      {/* Card 4: Reviews (List) */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <ReviewList reviews={reviews} />
        </div>
      </div>

      {/* Card 5: Post Review (Form) */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          <ReviewForm courseId={course._id} onReviewSuccess={reloadReviews} />
        </div>
      </div>

    </div>
  );
};

export default CourseContent;