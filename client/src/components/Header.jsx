import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { getCart, resetCart } from "../features/cart/cartSlice";
import {
  ShoppingCart,
  User,
  LogOut,
  Bell,
  Heart,
  Settings,
  FileText,
} from "lucide-react";
import logo from "../assets/img/auth/logo.svg";
import avatarDefault from "../assets/img/auth/logo.svg";
import NotificationMenu from "./common/NotificationMenu";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Lấy totalItems từ cart slice
  const { totalItems } = useSelector((state) => state.cart);
  const unreadCount = useSelector((state) => state.notification.unreadCount);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Load giỏ hàng khi user đăng nhập
  useEffect(() => {
    if (user) {
      dispatch(getCart());
    } else {
      dispatch(resetCart()); // Xóa state cart nếu logout/chưa login
    }
  }, [user, dispatch]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>

          {/* Center: Menu */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:text-rose-600 ${isActive ? "text-rose-600" : "text-gray-700"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                `hover:text-rose-600 ${isActive ? "text-rose-600" : "text-gray-700"
                }`
              }
            >
              Courses
            </NavLink>
            {/* <NavLink
              to="/blog"
              className={({ isActive }) =>
                `hover:text-rose-600 ${isActive ? "text-rose-600" : "text-gray-700"
                }`
              }
            >
              Blog
            </NavLink> */}
          </nav>

          {/* Right: Auth / User */}
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className="inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-white hover:bg-rose-600 text-sm font-medium"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="inline-flex items-center rounded-full border border-rose-500 px-4 py-2 text-rose-600 hover:bg-rose-50 text-sm font-medium"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Register
                </NavLink>
              </>
            ) : (
              <>
                <div className="relative">
                  <button
                    onClick={() => setNotificationOpen((v) => !v)}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    <Bell className="h-5 w-5 text-gray-700" />

                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                    {notificationOpen && (  
                      <div className="absolute top-full right-0 mt-2 z-50">
                        <NotificationMenu
                          open={notificationOpen}
                          onClose={() => setNotificationOpen(false)}
                        />
                      </div>
                    )}
                  </div>

                  { }
                <Link
                  to="/cart"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  <ShoppingCart className="h-5 w-5 text-gray-700" />
                  {/* Hiển thị số lượng dynamic */}
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                      {totalItems}
                    </span>
                  )}
                </Link>

                {/* 👤 User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={user.avatar || avatarDefault}
                      alt="avatar"
                      className="h-9 w-9 rounded-full border"
                    />
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      {user.name || "User"}
                    </span>
                    <i className="fas fa-chevron-down text-xs text-gray-500" />
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-100 bg-white shadow-lg p-3"
                      onMouseLeave={() => setMenuOpen(false)}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 border-b pb-3 mb-3">
                        <img
                          src={user.avatar || avatarDefault}
                          alt="avatar"
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <h6 className="text-sm font-semibold text-gray-800">
                            {user.name || "Undefined"}
                          </h6>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>

                      {/* Body */}
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>
                          <Link
                            to="/profile/dashboard"
                            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50"
                          >
                            <User className="h-4 w-4 text-rose-500" />
                            My Profile
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/profile/wishlist"
                            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50"
                          >
                            <Heart className="h-4 w-4 text-rose-500" />
                            Wishlist
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/profile/settings/edit"
                            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50"
                          >
                            <Settings className="h-4 w-4 text-rose-500" />
                            Settings
                          </Link>
                        </li>
                      </ul>

                      {/* Footer */}
                      <div className="border-t mt-3 pt-3">
                        <button
                          onClick={handleLogout}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 text-white py-2 hover:bg-rose-600"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
