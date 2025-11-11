import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { register, reset, setRegistrationEmail } from "../features/auth/authSlice";
import { toast } from "react-hot-toast";

import authImg from "../assets/img/auth/auth-1.svg";
import logo from "../assets/img/auth/logo.svg";
import google from "../assets/img/icons/google.svg";
import facebook from "../assets/img/icons/facebook.svg";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { name, email, password, confirmPassword } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { 
    isLoading, 
    isError, 
    message, 
    isRegisterSuccess // <-- Dùng cờ riêng
  } = useSelector(
    (state) => state.auth
  );

  // Toast + điều hướng sau khi đăng ký
  useEffect(() => {
    if (isError) {
      toast.error(message || "Đăng ký thất bại");
      dispatch(reset());
    }
    // Khi register() thành công (đã gửi OTP)
    if (isRegisterSuccess && message) {
      toast.success(message); // "Mã OTP đã được gửi..."
      // Không cần dispatch(setRegistrationEmail) vì slice đã tự làm
      dispatch(reset());
      navigate("/verify-otp"); // Chuyển sang trang nhập OTP
    }
  }, [isError, isRegisterSuccess, message, navigate, dispatch]);

  const onChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Mật khẩu không khớp!");
      return;
    }
    // Ghi nhớ email để gửi đi
    dispatch(setRegistrationEmail(email)); 
    dispatch(register({ name, email, password }));
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full">
        {/* LEFT: banner (ẩn mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-rose-50">
          <div className="flex w-full items-center justify-center p-12">
            <div className="max-w-[640px] w-full text-center">
              <div className="mb-10">
                <img
                  src={authImg}
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
              <div className="mt-10 flex items-center justify-center gap-2">
                <span className="h-2 w-14 rounded-full bg-rose-500/90" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: form */}
        <div className="w-full lg:w-1/2 flex">
          <div className="mx-auto flex w-full max-w-[820px] flex-col px-6 sm:px-10 py-8">
            {/* header */}
            <div className="flex items-center justify-between">
              <img src={logo} alt="Logo" className="h-10 hidden sm:block" />
              <Link
                to="/"
                className="text-rose-500 underline underline-offset-2 ml-auto"
              >
                Back to Home
              </Link>
            </div>

            <h1 className="mt-12 text-[44px] leading-[1.1] font-extrabold tracking-tight">
              Create Your Account
            </h1>

            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  required
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                             focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                               focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <i className="isax isax-sms text-sm" />
                  </span>
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                               focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                    <i className="isax isax-eye-slash text-sm" />
                  </span>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={onChange}
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
                className="mt-2 w-full rounded-full py-5 text-white text-lg font-semibold transition
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Signing Up...
                  </>
                ) : (
                  <>Sign Up</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-9 flex items-center gap-6 text-sm text-gray-500">
              <div className="h-px flex-1 bg-gray-200" />
              <span>Or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Socials */}
            <div className="mb-8 flex items-center justify-center gap-3">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm hover:bg-gray-50"
              >
                <img src={google} alt="Google" className="h-5 w-5" />
                Google
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm hover:bg-gray-50"
              >
                <img src={facebook} alt="Facebook" className="h-5 w-5" />
                Facebook
              </a>
            </div>

            <p className="mb-10 text-center text-sm text-gray-600">
              Already you have an account?
              <Link to="/login" className="ml-1 text-rose-500">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
