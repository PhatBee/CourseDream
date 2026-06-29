import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  PlusCircle,
  LogOut,
  User,
  Settings,
  CreditCard,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import logo from '../../assets/img/auth/logo.svg';

const InstructorSidebar = () => {
  const dispatch = useDispatch();

  const menuItems = [
    {
      path: '/instructor/dashboard',
      icon: <LayoutDashboard size={20} />,
      label: 'Tổng quan',
    },
    {
      path: '/instructor/courses',
      icon: <BookOpen size={20} />,
      label: 'Khóa học của tôi',
    },
    {
      path: '/instructor/add-course',
      icon: <PlusCircle size={20} />,
      label: 'Thêm khóa học',
    },
    {
      path: '/instructor/profile',
      icon: <User size={20} />,
      label: 'Thông tin cá nhân',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="DreamsLMS Logo" className="h-8 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/instructor/profile'}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-4 border-t border-gray-100 mx-4"></div>

        <ul className="space-y-1 px-3">
          <li>
            <NavLink
              to="/instructor/profile/settings"
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-rose-50 text-rose-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Settings size={20} />
              <span className="ml-3">Cài đặt</span>
            </NavLink>
          </li>
          <li>
            <button
              onClick={() => dispatch(logout())}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="ml-3">Đăng xuất</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default InstructorSidebar;

