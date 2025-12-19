import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toggleViewMode } from '../../features/auth/authSlice';

const ProfileHeader = () => {
  const dispatch = useDispatch();
  const { user, viewMode } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div className="p-5 mb-5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-800 text-white relative overflow-hidden shadow-lg text-left">
      <img
        // src="https://www.buyandship.today/contents/uploads/2023/09/footer-chiikawa-1024x414.jpeg" 
        className="absolute top-0 left-0 w-full h-full object-cover opacity-20"
      />

      {/* Bọc nội dung bằng relative z-10 để nổi lên trên */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">

        {/* Cột trái: Thông tin User */}
        <div className="flex items-center">
          <img
            src={user.avatar || "/src/assets/img/icons/apple-icon.png"}
            className="w-20 h-20 rounded-full border-2 border-white object-cover mr-4"
          />
          <div>
            <h5 className="text-white text-xl font-bold">{user.name}</h5>
            <p className="text-white opacity-80 capitalize">
              {viewMode}
            </p>
          </div>
        </div>

        {/* Cột phải: Logic chuyển đổi */}
        <div className="flex items-center gap-3">
          {user.role === 'student' ? (
            <Link
              to="/profile/become-instructor"
              className="px-4 py-2 bg-white text-blue-700 rounded-full text-sm font-bold hover:bg-gray-100 transition-all"
            >
              Become an Instructor
            </Link>
          ) : (
            <button
              onClick={() => {
                dispatch(toggleViewMode());
                navigate(0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md bg-white text-gray-800 ${
                viewMode === 'student'
                ? 'border border-emerald-400 hover:bg-emerald-50' 
                : 'border border-rose-400 hover:bg-rose-50'
              }`}
            >
              {viewMode === 'student' ? 'Instructor' : 'Student'} Dashboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileHeader;