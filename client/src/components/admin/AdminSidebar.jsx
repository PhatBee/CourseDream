import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, BookOpen, FileText, 
  Settings, LogOut, BarChart2, MessageSquare 
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';

const AdminSidebar = () => {
  const dispatch = useDispatch();

  const menuItems = [
    { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Students' },
    { path: '/admin/instructors', icon: <Users size={20} />, label: 'Instructors' },
    { path: '/admin/courses', icon: <BookOpen size={20} />, label: 'Courses' },
    { path: '/admin/blogs', icon: <FileText size={20} />, label: 'Blogs' }, // Thêm Blog
    { path: '/admin/reports', icon: <BarChart2 size={20} />, label: 'Reports' },
    { path: '/admin/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-rose-600 flex items-center gap-2">
          <span className="bg-rose-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-lg">E</span>
          Edaca
        </h1>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
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

        {/* Separator */}
        <div className="my-4 border-t border-gray-100 mx-4"></div>

        {/* Settings & Logout */}
        <ul className="space-y-1 px-3">
          <li>
            <NavLink to="/admin/settings" className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Settings size={20} />
              <span className="ml-3">Settings</span>
            </NavLink>
          </li>
          <li>
            <button 
              onClick={() => dispatch(logout())}
              className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="ml-3">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;