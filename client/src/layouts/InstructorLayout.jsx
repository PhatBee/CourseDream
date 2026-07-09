import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import InstructorSidebar from '../components/instructor/InstructorSidebar';
import InstructorHeader from '../components/instructor/InstructorHeader';

const InstructorLayout = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user || user.role !== 'instructor') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
      <InstructorSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <InstructorHeader user={user} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
};

export default InstructorLayout;

