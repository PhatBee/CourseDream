import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { forgotPassword, reset } from "../features/auth/authSlice";

import auth1 from "../assets/img/auth/auth-1.svg";
import logo from "../assets/img/auth/logo.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  // Setup Redux
  const dispatch = useDispatch();
  const { isLoading, isError, isForgotSuccess, message } = useSelector(
    (state) => state.auth
  );

  // useEffect xử lý state
  useEffect(() => {
    if (isError) {
      toast.error(message || "Gửi yêu cầu thất bại");
      dispatch(reset());
    }
    
    // Khi forgotPassword() thành công
    if (isForgotSuccess) {
      toast.success(message); // "Mã OTP đã được gửi..."
      dispatch(reset());
      navigate("/verify-reset-otp"); // Chuyển sang trang nhập OTP
    }
  }, [isError, isForgotSuccess, message, navigate, dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Vui lòng nhập email");
    // Dispatch action
    dispatch(forgotPassword(email));
  }

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full">
        {/* LEFT: Banner (ẩn mobile để khớp giao diện gốc) */}
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
              {/* Dots (giả lập slider như bản HTML) */}
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
              <Link
                to="/"
                className="text-rose-500 underline underline-offset-2"
              >
                Back to Home
              </Link>
            </div>

            <div className="mt-12">
              <h1 className="text-[32px] sm:text-[40px] font-bold mb-3">
                Forgot Password
              </h1>
              <p className="text-sm text-gray-600">
                Enter your email to reset your password.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[15px] font-medium"
                >
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                               focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <i className="isax isax-sms text-sm" />
                  </span>
                </div>
              </div>

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
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit <i className="isax isax-arrow-right-3" />
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

export default ForgotPassword;
