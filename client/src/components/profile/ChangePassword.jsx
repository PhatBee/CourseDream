import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword, reset } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ label, name, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition pr-12"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
};

const ChangePassword = () => {
  const dispatch = useDispatch();
  // Lấy thêm isSuccess
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  // State cho độ mạnh mật khẩu (0 -> 4)
  const [strength, setStrength] = useState(0);

  // Hàm tính độ mạnh mật khẩu
  const calculateStrength = (password) => {
    let score = 0;
    if (!password) return 0;

    if (password.length >= 8) score += 1; // Độ dài
    if (/[A-Z]/.test(password)) score += 1; // Chữ hoa
    if (/[0-9]/.test(password)) score += 1; // Số
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Ký tự đặc biệt

    return score; // Max 4
  };

  // Cập nhật strength khi newPassword thay đổi
  useEffect(() => {
    setStrength(calculateStrength(formData.newPassword));
  }, [formData.newPassword]);

  // Xử lý thông báo (Dùng isSuccess)
  useEffect(() => {
    if (isError && message) {
      toast.error(message);
      dispatch(reset());
    }
    if (isSuccess && message) {
      toast.success(message);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      dispatch(reset());
    }
  }, [isError, isSuccess, message, dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) return toast.error('Mật khẩu nhập lại không khớp!');
    if (strength < 2) return toast.error('Mật khẩu quá yếu!'); // Tùy chọn: bắt buộc mật khẩu mạnh

    dispatch(changePassword({ oldPassword: formData.oldPassword, newPassword: formData.newPassword }));
  };

  // Hàm lấy màu cho thanh bar dựa trên index và score hiện tại
  const getBarColor = (index) => {
    if (index >= strength) return 'bg-gray-200'; // Chưa đạt

    // Màu sắc dựa trên mức độ mạnh tổng thể
    switch (strength) {
      case 1: return 'bg-red-500';    // Yếu
      case 2: return 'bg-yellow-500'; // Trung bình
      case 3: return 'bg-blue-500';   // Khá
      case 4: return 'bg-green-500';  // Mạnh
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 text-left">
      <h3 className="text-lg font-bold text-gray-800 mb-1">Change Password</h3>
      <p className="text-sm text-gray-500 mb-6">Ensuring your account is using a long, random password to stay secure.</p>

      <form onSubmit={onSubmit} className="max-w-2xl">
        <PasswordInput
          label="Current Password"
          name="oldPassword"
          value={formData.oldPassword}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />

        <PasswordInput
          label="New Password"
          name="newPassword"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />

        {/* Thanh Progress Bar Dynamic */}
        <div className="flex gap-2 mb-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${getBarColor(index)}`}
            ></div>
          ))}
        </div>

        {/* Text hướng dẫn dynamic */}
        <p className={`text-xs mb-5 transition-colors ${strength === 4 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
          {strength === 0 && "Enter a new password."}
          {strength === 1 && "Weak. Add numbers or symbols."}
          {strength === 2 && "Medium. Add uppercase letters."}
          {strength === 3 && "Strong. Almost there."}
          {strength === 4 && "Very Strong! You're good to go."}
        </p>

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 px-8 py-3 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-200 disabled:opacity-70"
        >
          {isLoading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;