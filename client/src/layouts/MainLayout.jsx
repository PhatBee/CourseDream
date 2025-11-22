import React, { useEffect } from 'react';
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux'; 
import { getWishlist, clearWishlistState } from '../features/wishlist/wishlistSlice';
import Header from "../components/Header";

export default function MainLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(getWishlist());
    } else {

      dispatch(clearWishlistState());
    }
  }, [user, dispatch]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* chừa top padding để tránh che nội dung bởi header fixed */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
