import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import VerifyOTP from "../pages/VerifyOTP";
import ForgotPassword from "../pages/ForgotPassword";
import VerifyResetOTP from "../pages/VerifyResetOTP";
import SetPassword from "../pages/SetPassword";
import CourseDetail from '../pages/CourseDetail';
// import Header from '../components/Header'; // Không dùng trực tiếp ở đây
import ProfileLayout from '../layouts/ProfileLayout';
import MyProfile from '../components/profile/MyProfile';
import SettingsPage from '../pages/SettingsPage';
import EditProfile from '../components/profile/EditProfile';
import ChangePassword from '../components/profile/ChangePassword';
import WishlistPage from "../pages/WishlistPage";
import CoursePage from "../pages/CoursePage";
import LearningPage from "../pages/LearningPage";
import OverviewPage from "../pages/OverviewPage";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import PaymentReturn from "../pages/PaymentReturn";
import AddCoursePage from "../pages/instructor/AddCourse";
import PrivateRoute from "../components/common/PrivateRoute";
import EnrolledCoursesPage from "../pages/EnrolledCoursesPage";
import InstructorCourses from "../pages/instructor/InstructorCourses";
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import EditCoursePage from "../pages/instructor/EditCourse";
import StudentsManagement from "../pages/admin/StudentsManagement";
import InstructorsManagement from "../pages/admin/InstructorsManagement";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
        <Route path="/set-password" element={<SetPassword />} />
        
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<CoursePage />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/return" element={<PaymentReturn />} />

          <Route path="/profile" element={<ProfileLayout />}>
            <Route index element={<Navigate to="my-profile" replace />} />
            <Route path="my-profile" element={<MyProfile />} />
            
            <Route path="settings" element={<SettingsPage />}>
              <Route index element={<Navigate to="edit" replace />} />
              <Route path="edit" element={<EditProfile />} />
              <Route path="security" element={<ChangePassword />} />
            </Route>

            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="enrolled-courses" element={<EnrolledCoursesPage />} />
            
            <Route element={<PrivateRoute allowedRoles={['instructor', 'admin']} />}>
              <Route path="instructor/courses" element={<InstructorCourses />} />
            </Route>
          </Route>

          <Route path="/courses/:slug/overview" element={<OverviewPage />} />
          <Route path="/courses/:slug/learn/lecture/:lectureId" element={<LearningPage />} />

          <Route element={<PrivateRoute allowedRoles={['instructor', 'admin']} />}>
            <Route path="instructor/add-course" element={<AddCoursePage />} />
            <Route path="instructor/courses/:slug/edit" element={<EditCoursePage />} />
          </Route>
        </Route> 

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<StudentsManagement />} />
          <Route path="instructors" element={<InstructorsManagement />} />
          <Route path="courses" element={<div>Manage Courses</div>} />
          <Route path="blogs" element={<div>Manage Blogs</div>} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}