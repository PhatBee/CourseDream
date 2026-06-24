import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const InstructorProfileLayout = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="bg-gray-50 py-6">
      <div className="container mx-auto px-4 max-w-5xl">
        <Outlet />
      </div>
    </div>
  );
};

export default InstructorProfileLayout;

