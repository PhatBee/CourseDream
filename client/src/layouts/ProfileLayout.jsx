import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

import ProfileSidebar from '../components/common/ProfileSidebar';
import ProfileHeader from '../components/user/ProfileHeader';

const ProfileLayout = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="bg-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Dùng ProfileHeader đã cập nhật */}
        <ProfileHeader />

        <div className="flex flex-wrap lg:flex-nowrap -mx-4">
          
          {/* Dùng ProfileSidebar đã cập nhật */}
          <ProfileSidebar />

          {/* Cột Nội dung (Render các trang con) */}
          <div className="w-full lg:w-9/12 px-4 mt-6 lg:mt-0">
            {/* <Outlet> sẽ render MyProfile, Settings, v.v. */}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;