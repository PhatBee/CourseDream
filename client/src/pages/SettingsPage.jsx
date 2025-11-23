// src/pages/SettingsPage.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const SettingsTab = ({ to, label }) => {
  return (
    <li className="mr-2">
      <NavLink
        to={to}
        className={({ isActive }) => `
          inline-block px-4 py-3 text-sm font-medium border-b-2 transition-colors
          ${isActive 
            ? 'text-rose-500 border-rose-500' // Màu active đỏ hồng
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }
        `}
      >
        {label}
      </NavLink>
    </li>
  );
};

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <h5 className="text-2xl font-bold text-gray-800 text-left">Settings</h5>
      
      {/* Thanh Tab */}
      <div className="border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <SettingsTab to="/profile/settings/edit" label="Edit Profile" />
          <SettingsTab to="/profile/settings/security" label="Security" />
          <SettingsTab to="/profile/settings/social" label="Social Profiles" />
          <SettingsTab to="/profile/settings/linked" label="Linked Accounts" />
          <SettingsTab to="/profile/settings/notifications" label="Notifications" />
        </ul>
      </div>

      {/* Nội dung Form */}
      <div className="bg-white rounded-xl p-0 md:p-0"> 
        {/* Lưu ý: Padding = 0 vì component con (EditProfile) thường đã có padding hoặc border riêng */}
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsPage;