import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import Avatar from '../common/Avatar';
import NotificationMenu from '../common/NotificationMenu';

const InstructorHeader = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const unreadCount = useSelector((state) => state.notification.unreadCount);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/instructor/add-course')) return 'Tạo khóa học';
    if (path.includes('/instructor/courses')) return 'Khóa học của tôi';
    if (path.includes('/instructor/dashboard')) return 'Tổng quan';
    return 'Bảng điều khiển';
  };

  const title = getPageTitle();

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-10 text-left">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">Chào bạn, {user?.name || 'Giảng viên'}!</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            onClick={() => setNotificationOpen((v) => !v)}
            type="button"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          <NotificationMenu open={notificationOpen} onClose={() => setNotificationOpen(false)} />
        </div>

        <div className="h-8 w-[1px] bg-gray-200 mx-1" />

        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/instructor/profile')}>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800 group-hover:text-rose-600 transition-colors">
              {user?.name || 'Giang viên'}
            </p>
            <p className="text-xs text-gray-500 font-medium capitalize bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
              {user?.role || 'Giảng viên'}
            </p>
          </div>

          <Avatar
            src={user?.avatar}
            alt="Instructor Avatar"
            className="w-11 h-11 rounded-full border-2 border-white shadow-sm object-cover ring-2 ring-transparent group-hover:ring-rose-200 transition-all bg-gray-50"
          />
        </div>
      </div>
    </header>
  );
};

export default InstructorHeader;

