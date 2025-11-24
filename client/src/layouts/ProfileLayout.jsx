import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

import ProfileSidebar from '../components/common/ProfileSidebar';
import ProfileHeader from '../components/user/ProfileHeader';

const ProfileLayout = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="bg-gray-50 py-12 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        
        <ProfileHeader />

        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          
          {/* Sidebar bên trái */}
          <div className="w-full lg:w-1/4">
             <ProfileSidebar />
          </div>

          {/* Nội dung bên phải */}
          <div className="w-full lg:w-3/4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;