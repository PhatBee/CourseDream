// src/components/common/ProfileSidebar.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Grid, User, Settings, Lock, LogOut } from 'lucide-react';

const SidebarLink = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <li>
      <NavLink
        to={to}
        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium
          ${isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
      >
        {icon}
        {label}
      </NavLink>
    </li>
  );
};

const ProfileSidebar = () => {
  return (
    <div className="w-full lg:w-3/12 px-4">
      <div className="bg-white p-4 rounded-lg shadow-md sticky top-24 flex flex-col h-[calc(100vh-120px)] min-h-[400px]">
        <div className="flex-grow">
          <h6 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Dashboard
          </h6>
          <ul className="space-y-1">
            <SidebarLink
              to="/profile/dashboard"
              icon={<Grid size={18} className="mr-2" />}
              label="Dashboard"
            />
            <SidebarLink
              to="/profile"
              icon={<User size={18} className="mr-2" />}
              label="My Profile"
            />
            {/* (Thêm các link khác từ HTML vào đây: Enrolled Courses, Wishlist...) */}
          </ul>
        </div>

        {/* === ACCOUNT SETTINGS === */}
        <div className="flex-shrink-0">
          <hr className="my-4" />
          <h6 className="text-xs font-bold text-gray-500 uppercase mb-3">
            Account Settings
          </h6>
          <ul className="space-y-1">
            <SidebarLink
              to="/profile/settings/edit"
              icon={<Settings size={18} className="mr-2" />}
              label="Settings"
            />
            <li>
              {/* (Thêm logic logout vào đây) */}
              <a href="#" className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50">
                <LogOut size={18} className="mr-2" />
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;