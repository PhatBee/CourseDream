import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, ShoppingCart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';

const formatPrice = (price) => {
  if (price === 0) return 'FREE';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const countPercentage = (originalPrice, discountedPrice) => {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

const EnrollCard = ({ course }) => {
  const dispatch = useDispatch();
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { _id, price = 0, priceDiscount = 0 } = course;
  const discountPercentage = countPercentage(price, priceDiscount);

  const isInWishlist = wishlistItems.some(item => item._id === _id);

  const handleWishlistClick = () => {
    if (isInWishlist) {
      // Nếu đã có -> Xóa
      dispatch(removeFromWishlist(_id));
    } else {
      // Nếu chưa có -> Thêm
      dispatch(addToWishlist(_id));
    }
  };

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
          <button 
            onClick={handleWishlistClick}
            className={`btn-wishlist flex items-center justify-center gap-2 transition-colors duration-200
              ${isInWishlist 
                ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100' // Style khi đã thích
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' // Style mặc định
              }`}
          >
            {/* Icon tim: filled nếu đã thích, outline nếu chưa */}
            <Heart size={18} className={isInWishlist ? "fill-current" : ""} /> 
            {isInWishlist ? 'Wishlisted' : 'Add to Wishlist'}
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