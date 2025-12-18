import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ShoppingCart, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../features/wishlist/wishlistSlice';
import { addToCart } from '../../features/cart/cartSlice';
import { toast } from 'react-toastify';

const CourseCard = ({ course, isWishlistPage = false, isLiked, onToggleWishlist, viewMode = 'grid' }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const navigate = useNavigate();
  const { enrolledCourseIds } = useSelector((state) => state.enrollment);

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
  const isEnrolled = enrolledCourseIds?.includes(_id);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const isHeartFilled = isWishlistPage
    ? isLiked
    : wishlistItems?.some(item => item._id === _id);

  // Hàm redirect đến login với return URL
  const redirectToLogin = (action = 'continue') => {
    const currentPath = window.location.pathname;
    const returnUrl = encodeURIComponent(currentPath);
    navigate(`/login?returnUrl=${returnUrl}&action=${action}`);
  };

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    e.preventDefault();

    if (!user) {
      // Redirect trực tiếp đến login
      redirectToLogin('addToCart');
      return;
    }

    dispatch(addToCart(_id));
  };

  const handleHeartClick = (e) => {
    e.preventDefault();

    if (!user) {
      // Redirect trực tiếp đến login
      redirectToLogin('addToWishlist');
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

  const handleEnrollNow = (e) => {
    e.preventDefault();

    if (!user) {
      // Redirect trực tiếp đến login
      redirectToLogin('enroll');
      return;
    }

    // Navigate directly to checkout with this course
    navigate('/checkout', {
      state: {
        directCheckout: true,
        course: course
      }
    });
  };

  // Grid view (default)
  if (viewMode === 'grid') {
    return (
      <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden">

        {/* Thumbnail Area */}
        <div className="relative overflow-hidden">
          <Link to={`/courses/${slug}`}>
            <img
              src={thumbnail || '/default-course.svg'}
              alt={title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.src = '/default-course.svg'; }}
            />
          </Link>

          {/* Nút Wishlist (Heart) */}
          <button
            onClick={handleHeartClick}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-colors 
              ${isHeartFilled
                ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                : 'bg-white/80 text-gray-400 hover:text-rose-500 hover:bg-white'
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
              <span className={`text-lg font-bold ${isEnrolled ? 'text-green-600' : 'text-rose-600'}`}>
                {isEnrolled ? '' : (priceDiscount === 0 ? 'Free' : formatPrice(priceDiscount))}
              </span>
              {!isEnrolled && price > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(price)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <Link
                  to={`/courses/${slug}/overview`}
                  className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-medium rounded-full hover:from-rose-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                >
                  Go to Course
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleAddToCart}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Add to Cart"
                  >
                    <ShoppingCart size={20} />
                  </button>

                  <button
                    onClick={handleEnrollNow}
                    className="px-4 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Enroll
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 flex overflow-hidden">
      {/* Thumbnail */}
      <div className="relative w-64 flex-shrink-0">
        <Link to={`/courses/${slug}`}>
          <img
            src={thumbnail || '/default-course.svg'}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = '/default-course.svg'; }}
          />
        </Link>
        <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-md backdrop-blur-sm">
          {categoryName}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} />
              <span>{instructorName}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={16} className="fill-current" />
              <span className="font-bold text-gray-700">{rating.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">({reviewCount})</span>
            </div>
          </div>

          <Link to={`/courses/${slug}`}>
            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-col">
            <span className={`text-2xl font-bold ${isEnrolled ? 'text-green-600' : 'text-rose-600'}`}>
              {isEnrolled ? 'Enrolled' : (priceDiscount === 0 ? 'Free' : formatPrice(priceDiscount))}
            </span>
            {!isEnrolled && price > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleHeartClick}
              className={`p-2.5 rounded-full shadow-sm transition-colors 
                ${isHeartFilled
                  ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                  : 'bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50'
                }`}
              title={isHeartFilled ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              <Heart size={20} className={isHeartFilled ? "fill-current" : ""} />
            </button>

            {isEnrolled ? (
              <Link
                to={`/courses/${slug}/overview`}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-full hover:from-rose-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
              >
                Go to Course
              </Link>
            ) : (
              <>
                <button
                  onClick={handleAddToCart}
                  className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Add to Cart"
                >
                  <ShoppingCart size={22} />
                </button>

                <button
                  onClick={handleEnrollNow}
                  className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Enroll Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;