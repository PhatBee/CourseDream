import React from 'react';
import { Bell, Search } from 'lucide-react';

const AdminHeader = ({ user }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-96">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search courses, students..." 
          className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-600 placeholder-gray-400"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <img 
            src={user?.avatar || 'https://via.placeholder.com/40'} 
            alt="Admin Avatar" 
            className="w-10 h-10 rounded-full border-2 border-rose-100 object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;