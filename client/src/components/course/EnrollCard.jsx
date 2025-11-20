import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, ShoppingCart } from 'lucide-react';

const formatPrice = (price) => {
  if (price === 0) return 'FREE';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const countPercentage = (originalPrice, discountedPrice) => {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

const EnrollCard = ({ course }) => {
  const { price = 0, priceDiscount = 0 } = course;
  const discountPercentage = countPercentage(price, priceDiscount);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-3xl font-bold ${price === 0 ? 'text-green-600' : 'text-gray-800'}`}>
            {formatPrice(priceDiscount)}
          </h2>
          {price > 0 && (
            <p className="text-sm">
              <span className="text-gray-500 line-through mr-2">{formatPrice(price)}</span>
              <span className="text-red-500 font-medium">{discountPercentage}% off</span>
            </p>
          )}
        </div>
        
        <div className="flex justify-between gap-3 mb-3">
          <button className="btn-wishlist">
            <Heart size={18} /> Add to Wishlist
          </button>
          <button className="btn-wishlist">
            <Share2 size={18} /> Share
          </button>
        </div>
        
        <Link 
          to="/cart" 
          className="btn-primary"> Enroll Now
        </Link>
      </div>
    </div>
  );
};

export default EnrollCard;