import React, { useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  User,
  Settings,
  ShieldCheck,
  CreditCard,
  LockKeyhole,
  ArrowRight,
} from 'lucide-react';
import { logout, getProfile } from '../../features/auth/authSlice';
import Avatar from '../common/Avatar';

/**
 * Instructor profile/sidebar UX (mirrors student profile settings UX).
 * Routes expected:
 *  - /instructor/profile/edit
 *  - /instructor/profile/settings/security
 *  - /instructor/profile/settings/instructor-profile
 *  - /instructor/profile/settings/social-payout
 */
const TabLink = ({ to, icon, label }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border border-transparent w-full ${isActive
            ? 'bg-rose-50 text-rose-600 border-rose-200'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-gray-100'
          }`
        }
      >
        <span className="mr-3 inline-flex items-center justify-center text-gray-400">
          {icon}
        </span>
        <span>{label}</span>
      </NavLink>
    </li>
  );
};

const InstructorProfileSidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?._id) dispatch(getProfile());
  }, [dispatch, user?._id]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const isSecurityTabActive = location.pathname.includes('/instructor/profile/settings/security');

  const tabs = useMemo(
    () => [
      {
        to: '/instructor/profile/settings/edit',
        icon: <User size={18} />,
        label: 'Chỉnh sửa thông tin',
      },
      {
        to: '/instructor/profile/settings/security',
        icon: <LockKeyhole size={18} />,
        label: 'Thay đổi mật khẩu',
      },
      {
        to: '/instructor/profile/settings/instructor-profile',
        icon: <ShieldCheck size={18} />,
        label: 'Thông tin giảng viên',
      },
      {
        to: '/instructor/profile/settings/social-payout',
        icon: <CreditCard size={18} />,
        label: 'Thông tin mạng xã hội & thanh toán',
      },
    ],
    [],
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24 text-left">
      {/* Profile preview */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar
          src={user?.avatar}
          alt="Instructor"
          className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover ring-2 ring-transparent"
        />
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate">{user?.name || 'Giảng viên'}</p>
          <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
        </div>
      </div>

      <div className="mb-6">
        <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Settings
        </h6>
        <ul className="space-y-2">
          {tabs.map((t) => (
            <TabLink key={t.to} to={t.to} icon={t.icon} label={t.label} />
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 transition-all"
        >
          Logout <ArrowRight size={16} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default InstructorProfileSidebar;

