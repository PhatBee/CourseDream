// src/components/course/ReviewForm.js
import React, { useState } from 'react';
import { postReview } from '../../api/reviewApi';
import StarRating from '../common/StarRating';

const ReviewForm = ({ courseId, onReviewSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await postReview(courseId, { rating, comment });
      setComment('');
      if (onReviewSuccess) onReviewSuccess();
      alert('Đánh giá thành công!');
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
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
            required
          ></textarea>
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center px-6 py-2 border border-transparent rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;