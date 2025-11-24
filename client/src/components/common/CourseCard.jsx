import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';

const CourseCard = ({ course, isWishlistPage = false, isLiked, onToggleWishlist }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const {
    _id,
    title,
    slug,
    thumbnail,
    instructor,
    rating = 0,
    reviewCount = 0,
    price = 0,
    priceDiscount,
    categories = []
  } = course;

  const categoryName = categories[0]?.name || 'General';
  const instructorName = instructor?.name || 'Instructor';

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isHeartFilled = isWishlistPage
    ? isLiked
    : wishlistItems?.some(item => item._id === _id);

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    e.preventDefault(); // Ngăn chặn chuyển trang nếu nút nằm trong thẻ Link

    if (!user) {
      toast.info("Vui lòng đăng nhập để mua khóa học");
      return;
    }

    // Dispatch action thêm vào giỏ
    dispatch(addToCart(_id));
  };

  const handleHeartClick = (e) => {
    e.preventDefault();

    if (!user) {
      toast.info("Vui lòng đăng nhập để thêm vào danh sách yêu thích");
      return;
    }

    if (isWishlistPage && onToggleWishlist) {
      onToggleWishlist();
      return;
    }

    if (isHeartFilled) {
      dispatch(removeFromWishlist(_id));
    } else {
      dispatch(addToWishlist(_id));
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">

      {/* Thumbnail Area */}
      <div className="relative overflow-hidden">
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
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-colors 
            ${isHeartFilled
              ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' // Tim đỏ
              : 'bg-white/80 text-gray-400 hover:text-rose-500 hover:bg-white' // Tim rỗng
            }`}
          title={isHeartFilled ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={18} className={isHeartFilled ? "fill-current" : ""} />
        </button>

        <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-md backdrop-blur-sm">
          {categoryName}
        </span>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-grow">
        {/* ... (Phần này giữ nguyên như cũ) ... */}
        <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User size={14} />
            <span className="truncate max-w-[100px]">{instructorName}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star size={14} className="fill-current" />
            <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
            <span className="text-gray-400">({reviewCount})</span>
          </div>
        </div>

        <Link to={`/courses/${slug}`} className="block mb-2 flex-grow">
          <h3 className="text-base font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
        </Link>

        <div className="border-t border-gray-100 my-3"></div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-rose-600">
              {price === 0 ? 'Free' : formatPrice(price)}
            </span>
            {priceDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(priceDiscount)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Add to Cart"
            >
              <ShoppingCart size={20} />
            </button>

            {/* Nút Enroll: Bạn có thể để nó link sang trang chi tiết, 
               hoặc nếu là 'Buy Now' thì gọi addToCart rồi redirect sang checkout */}
            <Link
              to={`/courses/${slug}`} // Enroll thường dẫn vào trang chi tiết để xem trước khi mua
              className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Enroll
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;