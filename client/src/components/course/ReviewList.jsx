// src/components/course/ReviewList.js
import React from 'react';
import StarRating from '../common/StarRating'; // Giả sử bạn có component này

const ReviewList = ({ reviews }) => {
  if (reviews.length === 0) {
    return <p className="text-gray-500">Chưa có đánh giá nào cho khóa học này.</p>;
  }
  
  return (
    <div className="space-y-6">
       <h5 className="text-xl font-semibold text-gray-800">Student Feedback</h5>
      {reviews.map((review) => (
        <div key={review._id} className="flex gap-4">
          <img 
            src={review.student.avatar || 'default-avatar.jpg'} 
            alt={review.student.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h6 className="font-semibold">{review.student.name}</h6>
            <div className="flex items-center gap-2 my-1">
              <StarRating rating={review.rating} />
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-600">{review.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;