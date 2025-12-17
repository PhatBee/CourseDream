// src/components/course/ReviewForm.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addReview, fetchReviews } from './reviewSlice';
import StarRating from '../../components/common/StarRating';
import toast from 'react-hot-toast';

const ReviewForm = ({ courseId, onReviewSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(addReview({ courseId, data: { rating, comment } })).unwrap();
      setComment('');
      toast.success('Đánh giá thành công!');
      // Gọi lại fetchReviews để cập nhật danh sách đánh giá
      dispatch(fetchReviews(courseId));
      if (onReviewSuccess) onReviewSuccess();
    } catch {
      toast.error('Gửi đánh giá thất bại!');
    }
    setLoading(false);
  };

  return (
    <div>
      <h5 className="text-xl font-semibold text-gray-800 mb-4 text-left">Đánh giá khóa học</h5>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Số sao</label>
          <StarRating rating={rating} onChange={setRating} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Nhận xét</label>
          <textarea
            rows="4"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nhận xét của bạn"
            required
          ></textarea>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg group"
          >
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;