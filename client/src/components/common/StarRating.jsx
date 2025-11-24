// src/components/common/StarRating.jsx
import React from 'react';
import { Star, StarHalf } from 'lucide-react';

/**
 * Hiển thị rating bằng sao
 * @param {number} rating 
 * @param {number} size 
 * @param {string} color
 */
const StarRating = ({ rating = 0, size = 16, color = 'text-yellow-400' }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star key={`full-${i}`} size={size} className={`${color} fill-current`} />
    );
  }

  if (hasHalfStar) {
    stars.push(
      <StarHalf key="half" size={size} className={`${color} fill-current`} />
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star key={`empty-${i}`} size={size} className="text-gray-300 fill-current" />
    );
  }

  return (
    <div className="flex items-center">
      {stars}
    </div>
  );
};

export default StarRating;