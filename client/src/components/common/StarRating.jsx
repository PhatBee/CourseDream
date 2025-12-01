// src/components/common/StarRating.jsx
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

/**
 * Hiển thị rating bằng sao, cho phép chọn nếu có onChange
 * @param {number} rating 
 * @param {number} size 
 * @param {string} color
 * @param {function} onChange
 */
const StarRating = ({ rating = 0, size = 16, color = 'text-yellow-400', onChange }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 1; i <= fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} onClick={() => onChange && onChange(i)} className={onChange ? 'cursor-pointer' : ''}>
        <Star size={size} className={`${color} fill-current`} />
      </span>
    );
  }

  if (hasHalfStar) {
    const halfIndex = fullStars + 1;
    stars.push(
      <span key="half" onClick={() => onChange && onChange(halfIndex)} className={onChange ? 'cursor-pointer' : ''}>
        <StarHalf size={size} className={`${color} fill-current`} />
      </span>
    );
  }

  for (let i = 1; i <= emptyStars; i++) {
    const starIndex = fullStars + hasHalfStar + i;
    stars.push(
      <span key={`empty-${starIndex}`} onClick={() => onChange && onChange(starIndex)} className={onChange ? 'cursor-pointer' : ''}>
        <Star size={size} className="text-gray-300 fill-current" />
      </span>
    );
  }

  return (
    <div className="flex items-center">
      {stars}
    </div>
  );
};

export default StarRating;