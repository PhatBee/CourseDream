import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { login, reset, googleLogin, facebookLogin } from "../features/auth/authSlice";
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props'; // <-- Import render-props
import { toast } from "react-hot-toast";


import auth1 from "../assets/img/auth/auth-1.svg";
import google from "../assets/img/icons/google.svg";
import facebook from "../assets/img/icons/facebook.svg";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message || "Đăng nhập thất bại");
            dispatch(reset());
        }
        if (isSuccess || user) {
            if (isSuccess) toast.success("Đăng nhập thành công");

            if (user?.role === "admin") navigate("/admin/dashboard");
            else if (user?.role === "instructor") navigate("/instructor/dashboard");
            else navigate("/");
        }
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) =>
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const onSubmit = (e) => {
        e.preventDefault();
        const id = toast.loading("Đang đăng nhập...");
        dispatch(login({ email, password }))
            .unwrap()
            .then(() => toast.dismiss(id))          // success đã toast trong useEffect
            .catch(() => toast.dismiss(id));        // error đã toast trong useEffect
    };

    // Thêm handlers cho Google Login
    const handleGoogleSuccess = (credentialResponse) => {
        const credential = credentialResponse.credential;
        const id = toast.loading("Đang đăng nhập Google...");
        dispatch(googleLogin(credential))
            .unwrap()
            .then(() => toast.dismiss(id))
            .catch(() => toast.dismiss(id));
    };

    const handleGoogleError = () => {
        toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
    };

    // Thêm handlers cho Facebook Login
    const responseFacebook = (response) => {
        if (response.accessToken) {
            const id = toast.loading("Đang đăng nhập Facebook...");
            dispatch(facebookLogin(response.accessToken))
                .unwrap()
                .then(() => toast.dismiss(id))
                .catch(() => toast.dismiss(id));
        } else {
            toast.error("Đăng nhập Facebook thất bại. Vui lòng thử lại.");
        }
    };


    return (
        <div className="min-h-screen w-full">
            <div className="mx-auto flex min-h-screen w-full">
                {/* LEFT: banner */}
                <div className="hidden lg:flex lg:w-1/2 bg-rose-50">
                    <div className="flex w-full items-center justify-center p-12">
                        <div className="max-w-[640px] w-full text-center">
                            <div className="mb-10">
                                <img src={auth1} alt="Illustration" className="mx-auto w-full max-w-[520px]" />
                            </div>

                            <h3 className="text-[34px] leading-snug font-semibold mb-3">
                                Welcome to <br />
                                Dreams<span className="text-rose-500">LMS</span> Courses.
                            </h3>

                            <p className="text-gray-600 mx-auto max-w-[560px]">
                                Platform designed to help organizations, educators, and learners manage,
                                deliver, and track learning and training activities.
                            </p>

                            {/* fake carousel dots */}
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
                        <div className="flex items-center justify-end">
                            <Link to="/" className="text-rose-500 underline underline-offset-2">
                                Back to Home
                            </Link>
                        </div>

                        <h1 className="mt-14 text-[44px] leading-[1.1] font-extrabold tracking-tight">
                            Sign into Your Account
                        </h1>

                        <form onSubmit={onSubmit} className="mt-10 space-y-7">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-[15px] font-medium text-left">
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
                                <label htmlFor="password" className="mb-2 block text-[15px] font-medium text-left">
                                    Password <span className="text-rose-500">*</span>
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

                            {/* Row options */}
                            <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-2 select-none">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                                    />
                                    <span className="text-gray-700 text-[15px]">Remember Me</span>
                                </label>
                                <a href="/forgot-password" className="text-rose-500 text-[15px]">
                                    Forgot Password ?
                                </a>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-2 w-full rounded-full py-5 text-white text-lg font-semibold transition
                           bg-rose-500 hover:bg-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-200
                           inline-flex items-center justify-center gap-2"
                            >
                                {isLoading ? "Logging in..." : "Login"}
                                <i className="isax isax-arrow-right-3" />
                            </button>
                        </form>

                        {/* Divider Or */}
                        <div className="my-9 flex items-center gap-6 text-sm text-gray-500">
                            <div className="h-px flex-1 bg-gray-200" />
                            <span>Or</span>
                            <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        {/* Socials */}
                        <div className="mb-8 flex items-center justify-center gap-3">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                shape="circle"
                                theme="outline"
                                text="continue_with"
                                width="300px" // Bạn có thể tùy chỉnh
                            />
                            <FacebookLogin
                                appId={import.meta.env.VITE_FACEBOOK_APP_ID}
                                autoLoad={false}
                                fields="name,email,picture"
                                callback={responseFacebook}
                                render={renderProps => (
                                    <button
                                        onClick={renderProps.onClick}
                                        disabled={renderProps.disabled}
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm hover:bg-gray-50"
                                    >
                                        <img src={facebook} alt="Facebook" className="h-5 w-5" />
                                        Facebook
                                    </button>
                                )}
                            />
                        </div>

                        <p className="mb-10 text-center text-sm text-gray-600">
                            Don't you have an account?
                            <a href="/register" className="ml-1 text-rose-500">Sign up</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
