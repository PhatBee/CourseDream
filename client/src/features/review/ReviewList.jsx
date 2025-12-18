// src/components/course/ReviewList.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviews } from './reviewSlice';
import Spinner from '../../components/common/Spinner';
import StarRating from '../../components/common/StarRating';

const ReviewList = ({ courseId }) => {
  const dispatch = useDispatch();
  const { reviews, loading } = useSelector(state => state.review);

  useEffect(() => {
    if (courseId) dispatch(fetchReviews(courseId));
  }, [courseId, dispatch]);

  if (loading) return <Spinner />;
  if (!reviews.length) return <div>Chưa có đánh giá nào.</div>;

  return (
    <div className="space-y-6 text-left">
      <h5 className="text-xl font-semibold text-gray-800">Student Feedback</h5>
      {reviews.map((review) => (
        <div key={review._id} className="flex gap-4 border-b py-3">
          <img 
            src={review.student?.avatar || 'default-avatar.jpg'} 
            alt={review.student?.name}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{review.student?.name}</span>
              <StarRating rating={review.rating} readOnly />
            </div>
            <div className="flex items-center gap-2 my-1">
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