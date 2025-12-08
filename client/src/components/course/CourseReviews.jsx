// src/components/course/CourseReviews.js
import React from 'react';
import ReviewList from "../../features/review/ReviewList";
import ReviewForm from "../../features/review/ReviewForm";

const CourseReviews = ({ courseId, onReviewSuccess }) => {
  return (
    <div className="space-y-8">
      <ReviewList courseId={courseId} />
      <ReviewForm courseId={courseId} onReviewSuccess={onReviewSuccess} />
    </div>
  );
};

export default CourseReviews;