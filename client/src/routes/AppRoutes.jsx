import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOTP from "../pages/VerifyOTP";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyResetOTP from "../pages/VerifyResetOTP";
import SetPassword from "../pages/SetPassword";
import CourseDetail from '../pages/CourseDetail';
import Header from '../components/Header';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Header />
      <main className="pt-16"> {/* Offset cho Header fixed */}
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
