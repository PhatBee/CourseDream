import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Grid, User, Settings, LogOut, Heart, BookOpen, Book } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth/authSlice';

const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  // Kiểm tra active chính xác hơn (bao gồm cả sub-route)
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <li>
      <NavLink
        to={to}
        end={to === '/profile'} // Chỉ exact match với trang profile gốc
        className={({ isActive }) => `
          flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
          ${isActive
            ? 'bg-rose-50 text-rose-600 shadow-sm' // Active: Hồng nhạt
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <span className={isActive ? "text-rose-500" : "text-gray-400"}>
          {icon}
        </span>
        <span className="ml-3">{label}</span>
      </NavLink>
    </li>
  );
};

const ProfileSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async (e) => {
    e.preventDefault();
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-24 text-left">
      <div className="mb-6">
        <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">
          Dashboard
        </h6>
        <ul className="space-y-1">
          <SidebarLink to="/profile/dashboard" icon={<Grid size={20} />} label="Dashboard" />
          <SidebarLink to="/profile" icon={<User size={20} />} label="My Profile" />
          <SidebarLink to="/profile/enrolled-courses" icon={<BookOpen size={20} />} label="Enrolled Courses" />
          <SidebarLink to="/profile/wishlist" icon={<Heart size={20} />} label="Wishlist" />

          {/* Chỉ hiển thị Add Course nếu là Instructor hoặc Admin */}
          {(user?.role === 'instructor' || user?.role === 'admin') && (
            <>
              <SidebarLink to="/profile/instructor/courses" icon={<Book size={20} />} label="Courses" />
            </>
          )}
        </ul>
      </div>

      <div>
        <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">
          Account Settings
        </h6>
        <ul className="space-y-1">
          <SidebarLink to="/profile/settings/edit" icon={<Settings size={20} />} label="Settings" />
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProfileSidebar;