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
            ? 'text-rose-500 border-rose-500'
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
      <h5 className="text-2xl font-bold text-gray-800 text-left">Cài đặt</h5>

      <div className="border-b border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px">
          <SettingsTab to="/profile/settings/edit" label="Cập nhật thông tin" />
          <SettingsTab to="/profile/settings/security" label="Bảo mật" />
        </ul>
      </div>

      <div className="bg-white rounded-xl p-0">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsPage;