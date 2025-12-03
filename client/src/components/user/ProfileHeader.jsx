import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const ProfileHeader = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return null;

  return (
    <div className="p-5 mb-5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-800 text-white relative overflow-hidden shadow-lg">
      <img
        // src="https://www.buyandship.today/contents/uploads/2023/09/footer-chiikawa-1024x414.jpeg" 
        className="absolute top-0 left-0 w-full h-full object-cover opacity-20"
      />

      {/* Bọc nội dung bằng relative z-10 để nổi lên trên */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">

        {/* Cột trái: Thông tin User */}
        <div className="flex items-center">
          <div className="relative mr-4 flex-shrink-0">
            <img
              src={user.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-white object-cover"
            />
            {/* (Bạn có thể thêm icon "verify tick" ở đây) */}
          </div>
          <div>
            <h5 className="text-xl font-bold">{user.name}</h5>
            <p className="text-blue-100 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Cột phải: Nút bấm (Logic theo role) */}
        <div className="flex items-center gap-2">
          {/* Add course for instructor */}
          {user.role === 'instructor' || user.role === 'admin' && (
            <Link
              to="/instructor/add-course"
              className="px-4 py-2 bg-white text-blue-700 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Add Course
            </Link>
          )}


          {user.role === 'student' ? (
            // Nút "Become an Instructor" (nền trắng)
            <Link
              to="/profile/become-instructor" // Route này sẽ gọi API
              className="px-4 py-2 bg-white text-blue-700 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Become an Instructor
            </Link>
          ) : (
            // Nút "Instructor Dashboard" (nền đỏ)
            <Link
              to="/instructor/dashboard" // Route cho instructor
              className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Instructor Dashboard
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileHeader;