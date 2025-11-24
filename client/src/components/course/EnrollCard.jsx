import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, ShoppingCart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart } from '../../features/cart/cartSlice'; // Import addToCart
import ShareModal from '../common/ShareModal';

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
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [isShareOpen, setIsShareOpen] = useState(false);

  const { _id, title, price = 0, priceDiscount = 0, slug } = course;
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

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
      // navigate('/login'); // Có thể redirect nếu muốn
      return;
    }
    // Gọi action addToCart với _id của khóa học
    dispatch(addToCart(course._id));
  };

  const handleEnrollNow = () => {
    if (!user) {
      toast.info("Vui lòng đăng nhập");
      return;
    }
    // Để tạm thời, sẽ điều chỉnh sau
    // Logic Enroll Now: Thêm vào giỏ hàng -> Chuyển hướng ngay tới trang giỏ hàng
    dispatch(addToCart(course._id)).then((result) => {
      if (!result.error) {
        navigate('/cart');
      }
    });
  };

  const shareUrl = window.location.origin + '/courses/' + slug;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-5">
          {/* Price Section */}
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

          {/* Wishlist and Share Buttons */}
          <div className="flex justify-between gap-3 mb-4">
            <button
              onClick={handleWishlistClick}
              className={`btn-wishlist flex items-center justify-center gap-2 transition-colors duration-200
              ${isInWishlist
                  ? 'bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {/* Icon tim: filled nếu đã thích, outline nếu chưa */}
              <Heart size={18} className={isInWishlist ? "fill-current" : ""} />
              {isInWishlist ? 'Wishlisted' : 'Add to Wishlist'}
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="btn-wishlist flex items-center justify-center gap-2"
            >
              <Share2 size={18} /> Share
            </button>
          </div>

          {/* Add to Cart Button - Primary CTA */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg mb-3 group"
          >
            <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
            Add to Cart
          </button>

          {/* Enroll Now Button - Secondary CTA */}
          <button
            onClick={handleEnrollNow}
            className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-200 block text-center"
          >
            Enroll Now
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        url={shareUrl}
        title={title}
      />
    </>
  );
};

export default EnrollCard;