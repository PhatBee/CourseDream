import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, isLoading } = useSelector((state) => state.auth);

    if (isLoading && !user) {
        return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Nếu user không có quyền, redirect về trang chủ hoặc trang báo lỗi
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
