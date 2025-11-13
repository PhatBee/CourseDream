// src/components/common/Spinner.jsx
import React from 'react';

/**
 * Component Spinner đơn giản
 * @param {string} size - Kích thước của spinner (mặc định là 'w-12 h-12')
 * @param {string} color - Màu của spinner (mặc định là 'border-blue-600')
 */
const Spinner = ({ size = 'w-12 h-12', color = 'border-blue-600' }) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          ${size} 
          ${color}
          border-4 
          border-solid 
          rounded-full 
          animate-spin
        `}
        style={{
          borderTopColor: 'transparent', // Tạo hiệu ứng xoay
        }}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;