import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, ShoppingCart } from 'lucide-react';

const formatPrice = (price) => {
  if (price === 0) return 'FREE';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const EnrollCard = ({ course }) => {
  const { price = 0 } = course;
  const originalPrice = price * 2;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-3xl font-bold ${price === 0 ? 'text-green-600' : 'text-gray-800'}`}>
            {formatPrice(price)}
          </h2>
          {price > 0 && (
            <p className="text-sm">
              <span className="text-gray-500 line-through mr-2">{formatPrice(originalPrice)}</span>
              <span className="text-red-500 font-medium">50% off</span>
            </p>
          )}
        </div>
        
        <div className="flex justify-between gap-3 mb-3">
          <button 
            className={`
              flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 
              border border-gray-300 rounded-md 
              text-sm font-medium text-gray-700 bg-white
              hover:bg-rose-500 hover:text-white hover:border-rose-500
              transition-colors duration-200
            `}
          >
            <Heart size={18} /> Add to Wishlist
          </button>
          <button className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
            <Share2 size={18} /> Share
          </button>
        </div>
        
        <Link 
          to="/cart" 
          className={`
            w-full inline-flex justify-center items-center gap-2 px-6 py-3 
            border border-transparent rounded-md shadow-sm 
            text-base font-medium text-white 
            bg-rose-500 hover:bg-indigo-700
            transition-colors duration-200
          `}
        >
          <ShoppingCart size={20} /> Enroll Now
        </Link>
      </div>
    </div>
  );
};

export default EnrollCard;