// src/components/profile/ChangePassword.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword, reset } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { oldPassword, newPassword, confirmPassword } = formData;

  // Xử lý khi có lỗi hoặc thành công từ Redux
  useEffect(() => {
    if (isError && message) {
      toast.error('Lỗi: ' + message);
    }

    // 'Cập nhật mật khẩu thành công.'
    if (!isLoading && !isError && message.includes('Cập nhật mật khẩu')) {
      toast.success(message);
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }
    dispatch(reset()); // Reset state
  }, [isError, message, dispatch, isLoading]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu nhập lại
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu nhập lại không khớp!');
      return;
    }

    dispatch(changePassword({ oldPassword, newPassword }));
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-md text-left">
      <h5 className="text-xl font-bold mb-4">Security</h5>
      <form onSubmit={onSubmit} className="space-y-4 max-w-lg">

        {/* Mật khẩu cũ */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Old Password
          </label>
          <input
            type="password"
            name="oldPassword"
            value={oldPassword}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Mật khẩu mới */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Ít nhất 8 ký tự, 1 chữ hoa, 1 ký tự đặc biệt.
          </p>
        </div>

        {/* Nhập lại mật khẩu mới */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Nút Submit */}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;