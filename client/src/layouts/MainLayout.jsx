import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* chừa top padding để tránh che nội dung bởi header fixed */}
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}
