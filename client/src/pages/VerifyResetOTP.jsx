import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { verifyResetOTP, reset } from "../features/auth/authSlice";
import { toast } from "react-hot-toast";
import auth1 from "../assets/img/auth/auth-1.svg"; 

const VerifyResetOTP = () => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    isLoading, 
    isError, 
    message, 
    isVerifyResetSuccess, // <-- Dùng cờ riêng
    resetEmail // <-- Lấy email từ state
  } = useSelector(
    (state) => state.auth
  );

  // Nếu không có email (ví dụ: user tự gõ URL), đá về
  useEffect(() => {
    if (!resetEmail) {
      toast.error("Vui lòng bắt đầu từ trang Quên mật khẩu.");
      navigate("/forgot-password");
    }
  }, [resetEmail, navigate]);

  // Toast + điều hướng
  useEffect(() => {
    if (isError) {
      toast.error(message || "Xác thực thất bại");
      dispatch(reset());
    }
    
    // Khi verifyResetOTP() thành công
    if (isVerifyResetSuccess && message) {
      toast.success(message); // "Xác thực OTP thành công!"
      dispatch(reset());
      navigate("/set-password"); // Chuyển sang trang đặt mật khẩu
    }
  }, [isError, isVerifyResetSuccess, message, navigate, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Mã OTP phải có 6 chữ số.");
    dispatch(verifyResetOTP({ email: resetEmail, otp }));
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full">
        {/* LEFT: banner (Giống ForgotPassword.jsx) */}
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
        {/* RIGHT: form */}
        <div className="w-full lg:w-1/2 flex">
          <div className="mx-auto flex w-full max-w-[820px] flex-col px-6 sm:px-10 py-8">
            <h1 className="mt-12 text-[44px] font-extrabold">Xác thực OTP</h1>
            <p className="mt-2 text-gray-600">
              Một mã OTP đã được gửi đến <strong>{resetEmail || "email của bạn"}</strong>.
            </p>
            <form onSubmit={onSubmit} className="mt-10 space-y-6">
              <div>
                <label htmlFor="otp" className="mb-2 block text-[15px] font-medium">
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
                  className="block w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-[15px] outline-none
                             focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full py-5 text-white text-lg font-semibold bg-rose-500 hover:bg-rose-600 disabled:opacity-70"
              >
                {isLoading ? "Đang xác thực..." : "Xác thực"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetOTP;