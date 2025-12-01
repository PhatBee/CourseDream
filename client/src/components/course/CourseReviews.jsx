// src/components/course/CourseReviews.js
import React from 'react';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

const CourseReviews = ({ reviews = [], courseId, onReviewSuccess }) => {
  return (
    <div className="space-y-8">
      <ReviewList reviews={reviews} />
      <ReviewForm courseId={courseId} onReviewSuccess={onReviewSuccess} />
    </div>
  );
};

export default CourseReviews;