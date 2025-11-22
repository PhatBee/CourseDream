import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, clearWishlist } from '../features/wishlist/wishlistSlice';
import CourseCard from '../components/common/CourseCard';
import { Trash2, HeartOff } from 'lucide-react';
import Spinner from '../components/common/Spinner';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(getWishlist());
  }, [dispatch]);

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?')) {
      dispatch(clearWishlist());
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header của Wishlist */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Wishlist</h2>
        
        {items.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="flex items-center text-rose-500 hover:text-rose-700 text-sm font-medium transition-colors"
          >
            <Trash2 size={16} className="mr-1.5" />
            Remove All
          </button>
        )}
      </div>

      {/* Content */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((course) => (
            <CourseCard 
              key={course._id} 
              course={course} 
              isWishlistPage={true}
            />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-50 rounded-full">
              <HeartOff size={40} className="text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="text-gray-500 mt-1 mb-6">Explore courses and add them to your wishlist.</p>
          <a href="/courses" className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium">
            Explore Courses
          </a>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;