// src/pages/SettingsPage.jsx
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

// Component con cho Tab Link
const SettingsTab = ({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <li>
      <NavLink
        to={to}
        className={`px-4 py-3 text-sm font-medium border-b-2
          ${isActive 
            ? 'text-red-500 border-red-500' // Màu active
            : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
      >
        {label}
      </NavLink>
    </li>
  );
};

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <h5 className="text-xl font-bold text-gray-800 text-left">Settings</h5>
      
      {/* Thanh Nav Tab (từ HTML/ảnh) */}
      <div className="border-b bg-white rounded-lg shadow-sm">
        <ul className="flex items-center flex-wrap">
          <SettingsTab to="/profile/settings/edit" label="Edit Profile" />
          <SettingsTab to="/profile/settings/security" label="Security" />
          {/* (Thêm các tab khác từ HTML nếu bạn muốn) */}
        </ul>
      </div>

      {/* Nội dung Tab (Form) */}
      {/* <Outlet> sẽ render EditProfile.jsx hoặc ChangePassword.jsx */}
        <Outlet />
      </div>
  );
};

export default SettingsPage;