import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const SettingsTab = ({ to, label }) => {
  return (
    <li className="mr-2">
      <NavLink
        to={to}
        end
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

const InstructorSettingsLayout = () => {
  return (
    <div className="space-y-6 text-left w-full">
      <div>
        <h5 className="text-2xl font-bold text-gray-800">Profile Settings</h5>
        <p className="text-sm text-gray-500 mt-1">Manage your public account details and preferences</p>
      </div>
      
      {/* Thanh điều hướng 4 Tab của Instructor */}
      <div className="border-b border-gray-200 mb-4">
        <ul className="flex flex-wrap -mb-px">
          <SettingsTab to="/instructor/profile/settings/edit" label="Edit Profile" />
          <SettingsTab to="/instructor/profile/settings/security" label="Change Password" />
          <SettingsTab to="/instructor/profile/settings/instructor-profile" label="Instructor Profile" />
          <SettingsTab to="/instructor/profile/settings/social-payout" label="Social & Payout" />
        </ul>
      </div>

      {/* Nơi render các form con: EditProfile, ChangePassword,... */}
      <div className="bg-white rounded-xl">
        <Outlet />
      </div>
    </div>
  );
};

export default InstructorSettingsLayout;