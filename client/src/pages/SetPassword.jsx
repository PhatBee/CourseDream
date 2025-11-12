import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import { useSelector, useDispatch } from "react-redux";
import { setNewPassword, clearReset, clearStatus  } from "../features/auth/authSlice";

import auth1 from "../assets/img/auth/auth-1.svg";
import logo from "../assets/img/auth/logo.svg";

const SetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  // Setup Redux
  const dispatch = useDispatch();
  const { 
    isLoading, 
    isError, 
    isSetPasswordSuccess, 
    message, 
    resetToken // <-- Lấy token
  } = useSelector((state) => state.auth);

  // useEffect xử lý state
  useEffect(() => {
    // Nếu không có token, không cho ở lại trang này
    if (!resetToken) {
      toast.error("Phiên đặt lại mật khẩu không hợp lệ.");
      navigate("/forgot-password");
    }
  }, [resetToken, navigate]);

  useEffect(() => {
    if (isError) {
      toast.error(message || "Đặt lại mật khẩu thất bại");
      dispatch(clearStatus());
    }
    
    // Khi setPassword() thành công
    if (isSetPasswordSuccess) {
      toast.success(message); // "Đặt lại mật khẩu thành công!"
      dispatch(clearReset()); // Xóa state (token, email)
      navigate("/login"); // Về trang đăng nhập
    }
  }, [isError, isSetPasswordSuccess, message, navigate, dispatch]);

  // Đánh giá độ mạnh đơn giản (đủ dùng cho UI)
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0..4
  };
  const strength = getStrength();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!password) return toast.error("Vui lòng nhập mật khẩu mới");
    if (password !== confirm) return toast.error("Mật khẩu xác nhận không khớp");
    // Dispatch action
    dispatch(setNewPassword({ resetToken, password }));
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full">
        {/* LEFT: Banner (đồng bộ với Login/Register) */}
        <div className="hidden lg:flex lg:w-1/2 bg-rose-50">
          <div className="flex w-full items-center justify-center p-12">
            <div className="max-w-[640px] w-full text-center">
              <div className="mb-10">
                <img
                  src={auth1}
                  alt="Illustration"
                  className="mx-auto w-full max-w-[520px]"
                />
              </div>
              <h3 className="text-[34px] leading-snug font-semibold mb-3">
                Welcome to <br />
                Dreams<span className="text-rose-500">LMS</span> Courses.
              </h3>
              <p className="text-gray-600 mx-auto max-w-[560px]">
                Platform designed to help organizations, educators, and learners
                manage, deliver, and track learning and training activities.
              </p>
              {/* Dots giả lập slider */}
              <div className="mt-10 flex items-center justify-center gap-2">
                <span className="h-2 w-14 rounded-full bg-rose-500/90" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="w-full lg:w-1/2 flex">
          <div className="mx-auto flex w-full max-w-[820px] flex-col px-6 sm:px-10 py-8">
            <div className="flex items-center justify-between">
              <img src={logo} alt="Logo" className="h-10 hidden sm:block" />
              <Link to="/" className="text-rose-500 underline underline-offset-2">
                Back to Home
              </Link>
            </div>

            <div className="mt-12">
              <h1 className="text-[32px] sm:text-[40px] font-bold mb-2">Set Password</h1>
              <p className="text-sm text-gray-600">
                Your new password must be different from previous password
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-[15px] font-medium">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                               focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <i className="isax isax-eye-slash text-sm" />
                  </span>
                </div>

                {/* Strength bar (4 mức: poor/weak/strong/heavy) */}
                <div className="mt-3 flex gap-2" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-2 flex-1 rounded ${strength > i ? "bg-rose-500" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {strength === 0 && "Use at least 8 characters"}
                  {strength === 1 && "Weak password"}
                  {strength === 2 && "Fair password"}
                  {strength === 3 && "Strong password"}
                  {strength === 4 && "Very strong password"}
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label htmlFor="confirm" className="mb-2 block text-[15px] font-medium">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                               focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <i className="isax isax-eye-slash text-sm" />
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full py-5 text-white text-lg font-semibold transition
                           bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-200
                           inline-flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Resetting…
                  </>
                ) : (
                  <>
                    Reset Password <i className="isax isax-arrow-right-3" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-sm text-gray-700 text-center">
              Remember Password?
              <Link to="/login" className="ml-1 text-rose-500">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
