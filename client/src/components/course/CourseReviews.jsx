// src/components/course/CourseReviews.js
import React from 'react';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

const CourseReviews = ({ reviews = [] }) => {
  return (
    <div className="space-y-8">
      {/* Phần danh sách review (tôi sẽ thêm vào) */}
      <ReviewList reviews={reviews} />
      
      {/* Phần form (từ HTML) */}
      <ReviewForm />
    </div>
  );
};

export default CourseReviews;