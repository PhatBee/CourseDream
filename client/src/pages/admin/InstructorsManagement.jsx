// src/pages/admin/InstructorsManagement.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const TabLink = ({ to, label, count }) => {
  return (
    <li className="mr-6">
      <NavLink
        to={to}
        className={({ isActive }) => `
          inline-flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-all
          ${isActive 
            ? 'text-rose-600 border-rose-600' 
            : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
          }
        `}
      >
        {label}
        {count !== undefined && count > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                location.pathname.includes(to) ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'
            }`}>
                {count}
            </span>
        )}
      </NavLink>
    </li>
  );
};

const InstructorsManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Giảng Viên</h1>
      </div>
      
      {/* Thanh Tab - Đồng bộ style với SettingsPage */}
      <div className="border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <TabLink to="/admin/instructors/list" label="Danh sách giảng viên" />
          {/* Bạn có thể lấy số lượng pending từ redux store để hiển thị badge count ở đây nếu muốn */}
          <TabLink to="/admin/instructors/applications" label="Đơn đăng ký chờ duyệt" />
        </ul>
      </div>

      {/* Nội dung thay đổi theo Route con */}
      <div className="min-h-[400px]"> 
        <Outlet />
      </div>
    </div>
  );
};

export default InstructorsManagement;