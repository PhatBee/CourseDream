import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Tạo mảng số trang [1, 2, 3...]
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center justify-between mt-8 pt-4 border-t border-gray-100">
      {/* Text bên trái */}
      <p className="text-sm text-gray-500 mb-4 sm:mb-0">
        Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
      </p>

      {/* Nút bấm bên phải */}
      <div className="flex items-center gap-2">
        {/* Nút Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors
            ${currentPage === 1 
              ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
              : 'text-gray-600 hover:bg-gray-100 bg-white border border-gray-200'
            }`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Các số trang */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 flex items-center justify-center rounded-full font-medium transition-all
              ${currentPage === page
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200' // Active
                : 'text-gray-600 hover:bg-gray-100 bg-white' // Inactive
              }`}
          >
            {page}
          </button>
        ))}

        {/* Nút Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors
            ${currentPage === totalPages 
              ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
              : 'text-gray-600 hover:bg-gray-100 bg-white border border-gray-200'
            }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;