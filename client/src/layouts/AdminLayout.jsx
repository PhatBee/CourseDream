import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';

const AdminLayout = () => {
  const { user } = useSelector((state) => state.auth);

  // Bảo vệ route: Chỉ Admin mới được vào
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Sidebar bên trái (Cố định) */}
      <AdminSidebar />

      {/* Khu vực nội dung bên phải */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header Admin */}
        <AdminHeader user={user} />

        {/* Nội dung chính (Scrollable) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;