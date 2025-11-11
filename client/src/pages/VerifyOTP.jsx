import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { verifyOTP, reset } from "../features/auth/authSlice";
import { toast } from "react-hot-toast";

// (Bạn có thể dùng lại các ảnh tương tự trang Register)
import authImg from "../assets/img/auth/auth-1.svg";
import logo from "../assets/img/auth/logo.svg";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    isLoading, 
    isError, 
    message, 
    isVerifySuccess, // <-- Dùng cờ riêng
    registrationEmail // <-- Lấy email từ state
  } = useSelector(
    (state) => state.auth
  );

  // Nếu không có email (ví dụ: user tự gõ /verify-otp), đá về trang đăng ký
  useEffect(() => {
    if (!registrationEmail) {
      toast.error("Vui lòng đăng ký trước.");
      navigate("/register");
    }
  }, [registrationEmail, navigate]);

  // Toast + điều hướng sau khi XÁC THỰC
  useEffect(() => {
    if (isError) {
      toast.error(message || "Xác thực thất bại");
      dispatch(reset());
    }
    
    // Khi verifyOTP() thành công
    if (isVerifySuccess && message) {
      toast.success(message); // "Xác thực thành công! Vui lòng đăng nhập."
      dispatch(reset());
      navigate("/login"); // Chuyển sang trang đăng nhập
    }
  }, [isError, isVerifySuccess, message, navigate, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Mã OTP phải có 6 chữ số.");
      return;
    }
    dispatch(verifyOTP({ email: registrationEmail, otp }));
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full">
        {/* LEFT: banner (Giống Register.jsx) */}
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
              <Link to="/" className="text-rose-500 underline underline-offset-2 ml-auto">
                Back to Home
              </Link>
            </div>

            <h1 className="mt-12 text-[44px] leading-[1.1] font-extrabold tracking-tight">
              Xác thực tài khoản
            </h1>
            <p className="mt-2 text-gray-600">
              Một mã OTP đã được gửi đến <strong>{registrationEmail || "email của bạn"}</strong>. Vui lòng nhập mã vào bên dưới.
            </p>

            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              {/* OTP */}
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  Mã OTP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="block w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[15px] outline-none
                             focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-full py-5 text-white text-lg font-semibold transition
                           bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-200
                           inline-flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? "Đang xác thực..." : "Xác thực"}
              </button>
            </form>
            
            <p className="mb-10 text-center text-sm text-gray-600 mt-6">
              Chưa nhận được mã?
              <Link to="/register" className="ml-1 text-rose-500">
                Gửi lại
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;