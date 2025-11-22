import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { removeFromWishlist } from '../../features/wishlist/wishlistSlice';

const CourseCard = ({ course, isWishlistPage = false }) => {
  const dispatch = useDispatch();

  const {
    _id,
    title,
    slug,
    thumbnail,
    instructor,
    rating = 0,
    reviewCount = 0,
    price = 0,
    level,
    categories = []
  } = course;

  const categoryName = categories[0]?.name || 'General';
  const instructorName = instructor?.name || 'Unknown';
  const instructorAvatar = instructor?.avatar || 'default-avatar.png';

  // Hàm xử lý khi bấm nút tim
  const handleHeartClick = (e) => {
    e.preventDefault(); // Ngăn chặn link click
    if (isWishlistPage) {
      // Nếu đang ở trang wishlist, bấm tim là xóa
      if (window.confirm('Bạn có chắc muốn xóa khóa học này khỏi wishlist?')) {
        dispatch(removeFromWishlist(_id));
      }
    } else {
      // Logic thêm vào wishlist (cho trang home - sẽ làm sau)
      console.log("Add to wishlist logic here");
    }
  };

  // Format giá tiền
  const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* 1. Thumbnail Area */}
      <div className="relative">
        <Link to={`/courses/${slug}`}>
          <img 
            src={thumbnail || 'https://via.placeholder.com/300x200'} 
            alt={title} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Nút Wishlist (Heart) */}
        <button 
          onClick={handleHeartClick}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white text-rose-500 shadow-sm transition-colors"
          title={isWishlistPage ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={18} className={isWishlistPage ? "fill-current" : ""} />
        </button>

        {/* Badge Category */}
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-md backdrop-blur-sm">
          {categoryName}
        </span>
      </div>

      {/* 2. Content Area */}
      <div className="p-4 flex flex-col flex-grow">
        
        {/* Instructor Info */}
        <div className="flex items-center mb-3">
          <img src={instructorAvatar} alt={instructorName} className="w-6 h-6 rounded-full object-cover mr-2" />
          <span className="text-sm text-gray-500 truncate">{instructorName}</span>
        </div>

        {/* Title */}
        <Link to={`/courses/${slug}`} className="block mb-2">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-4 text-sm">
          <Star size={16} className="text-yellow-400 fill-current mr-1" />
          <span className="font-bold text-gray-800 mr-1">{rating.toFixed(1)}</span>
          <span className="text-gray-500">({reviewCount} reviews)</span>
        </div>

        {/* Footer: Price & Buttons */}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
          {/* Giá */}
          <div className="text-lg font-bold text-rose-600">
            {price === 0 ? 'Free' : formattedPrice}
          </div>

          {/* Actions: Cart & Enroll */}
          <div className="flex items-center gap-2">
            {/* Nút Cart */}
            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Add to Cart">
              <ShoppingCart size={20} />
            </button>
            
            {/* Nút Enroll */}
            <Link 
              to={`/cart`} // Hoặc link checkout
              className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-blue-600 transition-colors"
            >
              Enroll Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;