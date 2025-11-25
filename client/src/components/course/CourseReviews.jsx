// src/components/course/CourseReviews.js
import React from 'react';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

const CourseReviews = ({ reviews = [] }) => {
  return (
    <div className="space-y-8">
      <ReviewList reviews={reviews} />
      <ReviewForm />
    </div>
  );
};

export default CourseReviews;