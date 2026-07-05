import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { adminLogin, resetAdminAuth } from "../features/admin/adminSlice";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Shield, Lock } from "lucide-react";

import auth1 from "../assets/img/auth/auth-1.svg";

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { email, password } = formData;

  const dispatch = useDispatch();

  const {
    adminAuthUser,
    adminAuthLoading,
    adminAuthError,
    adminAuthSuccess,
    adminAuthMessage,
  } = useSelector((state) => state.admin);

  // Nếu đã đăng nhập là admin thì redirect luôn (không cần React Router)
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser?.role === "admin") {
      window.location.replace("/admin/dashboard");
    }
  }, []);

  // Reset state khi mount
  useEffect(() => {
    dispatch(resetAdminAuth());
  }, [dispatch]);

  useEffect(() => {
    if (adminAuthError) {
      toast.error(adminAuthMessage || "Đăng nhập thất bại");
      dispatch(resetAdminAuth());
    }
    if (adminAuthSuccess && adminAuthUser?.role === "admin") {
      toast.success("Đăng nhập thành công! Đang chuyển hướng...");
      // Dùng window.location.replace để force reload:
      // authSlice sẽ re-initialize từ localStorage (user đã được lưu bởi adminService)
      // -> ProtectedRoute sẽ thấy user.role='admin' và cho vào dashboard
      window.location.replace("/admin/dashboard");
    } else if (adminAuthSuccess && adminAuthUser && adminAuthUser.role !== "admin") {
      toast.error("Bạn không có quyền truy cập trang quản trị.");
      dispatch(resetAdminAuth());
    }
  }, [adminAuthError, adminAuthSuccess, adminAuthMessage, adminAuthUser, dispatch]);

  const onChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    const id = toast.loading("Đang xác thực...");
    dispatch(adminLogin({ email, password }))
      .unwrap()
      .then(() => toast.dismiss(id))
      .catch(() => toast.dismiss(id));
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full">

        {/* LEFT: Banner — giữ nguyên phong cách rose như Login.jsx */}
        <div className="hidden lg:flex lg:w-1/2 bg-rose-50 relative overflow-hidden">
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "320px",
              height: "320px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(244,63,94,0.10) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-80px",
              left: "-40px",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)",
            }}
          />

          <div className="flex w-full items-center justify-center p-12 relative z-10">
            <div className="max-w-[640px] w-full text-center">
              <div className="mb-10">
                <img
                  src={auth1}
                  alt="Admin Illustration"
                  className="mx-auto w-full max-w-[520px]"
                />
              </div>

              {/* Admin badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(244,63,94,0.08)",
                  border: "1px solid rgba(244,63,94,0.2)",
                  borderRadius: "999px",
                  padding: "8px 20px",
                  marginBottom: "16px",
                }}
              >
                <Shield size={14} color="#e11d48" />
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#e11d48",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  Admin Portal
                </span>
              </div>

              <h3 className="text-[34px] leading-snug font-semibold mb-3">
                Quản trị hệ thống <br />
                Dreams<span className="text-rose-500">LMS</span> Courses.
              </h3>

              <p className="text-gray-500 mx-auto max-w-[480px] text-[15px] leading-relaxed">
                Khu vực dành riêng cho quản trị viên. Chỉ hỗ trợ đăng nhập
                bằng <strong>Email &amp; Mật khẩu</strong>.
              </p>

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
            {/* Top nav */}
            <div className="flex items-center justify-end">
              <a
                href="/login"
                className="text-rose-500 underline underline-offset-2 text-[14px]"
              >
                ← Đăng nhập thông thường
              </a>
            </div>

            {/* Header */}
            <div className="mt-14">
              {/* Shield icon */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                  marginBottom: "20px",
                  boxShadow: "0 6px 24px rgba(244,63,94,0.30)",
                }}
              >
                <Shield size={26} color="#fff" />
              </div>

              <h1 className="text-[44px] leading-[1.1] font-extrabold tracking-tight">
                Đăng nhập quản trị
              </h1>
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "15px",
                  color: "#6b7280",
                }}
              >
                Khu vực bảo mật cao — chỉ dành cho{" "}
                <span className="text-rose-500 font-semibold">Admin</span>
              </p>
            </div>

            {/* Warning notice */}
            <div
              style={{
                marginTop: "28px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "#fff7f8",
                border: "1px solid #fecdd3",
                borderRadius: "14px",
                padding: "12px 16px",
              }}
            >
              <Lock size={15} color="#e11d48" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "13px", color: "#9f1239", lineHeight: "1.55", margin: 0 }}>
                Chỉ hỗ trợ đăng nhập bằng{" "}
                <strong>Email &amp; Mật khẩu</strong>.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-10 space-y-7">
              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  Email quản trị <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="admin-email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    required
                    autoComplete="username"
                    placeholder="admin@example.com"
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
                  htmlFor="admin-password"
                  className="mb-2 block text-[15px] font-medium text-left"
                >
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="admin-password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="block w-full rounded-2xl border border-gray-200 bg-white pl-4 pr-12 py-3.5 text-[15px] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-rose-500 transition-colors z-10"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="admin-login-submit"
                disabled={adminAuthLoading}
                className="mt-2 w-full rounded-full py-5 text-white text-lg font-semibold transition
                           bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-200
                           inline-flex items-center justify-center gap-2"
              >
                {adminAuthLoading ? (
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Đăng nhập quản trị
                    <Shield size={20} />
                  </>
                )}
              </button>
            </form>

            {/* Security footer */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: "40px",
                paddingBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Lock size={13} color="#d1d5db" />
              <span style={{ fontSize: "12.5px", color: "#d1d5db" }}>
                Kết nối được mã hoá · DreamsLMS Admin Portal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
