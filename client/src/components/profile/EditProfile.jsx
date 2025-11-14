// src/components/profile/EditProfile.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, reset } from '../../features/auth/authSlice';
import { toast } from 'react-toastify';

const EditProfile = () => {
    const dispatch = useDispatch();
    const { user, isLoading, isError, message } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar: '', // Có thể thêm logic upload ảnh
    });

    // 1. Tải dữ liệu của user vào form khi component mount
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                bio: user.bio || '',
                avatar: user.avatar || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    // 2. Xử lý khi có lỗi hoặc thành công từ Redux
    useEffect(() => {
        if (isError && message) {
            toast.error(message);
            alert('Lỗi: ' + message);
        }

        // 'Cập nhật thông tin thành công.'
        if (!isLoading && !isError && message.includes('Cập nhật thông tin')) {
            toast.success(message);
            alert(message);
        }
        dispatch(reset()); // Reset state (message, isError)
    }, [isError, message, dispatch, isLoading]);


    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        dispatch(updateProfile(formData));
    };

    return (
        <div className="bg-white p-5 rounded-lg shadow-md text-left">

            <form onSubmit={onSubmit} className="space-y-6 divide-y divide-gray-200">
                {/* Upload Ảnh */}
                <div className="flex items-center space-x-4">
                    <img
                        src={formData.avatar || 'default-avatar.jpg'}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-2"
                    />
                    <div>
                        <button type="button" className="text-sm px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
                            Upload Photo
                        </button>
                        <p className="text-xs text-gray-500 mt-1">PNG or JPG. (Tạm thời ô này chưa có logic)</p>
                        {/* Bạn có thể thêm <input type="file" ... /> */}
                    </div>
                </div>

                <div className="pt-6">
                    <h5 className="text-xl font-bold mb-4">Personal Details</h5>
                    <p className="text-sm text-gray-500 mb-6">Edit your personal information</p>

                    {/* Full Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={onChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={onChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Bio */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">
                            Bio
                        </label>
                        <textarea
                            name="bio"
                            rows="4"
                            value={formData.bio}
                            onChange={onChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Tell us about yourself..."
                        ></textarea>
                    </div>

                    {/* Nút Submit */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {isLoading ? 'Saving...' : 'Update Profile'}
                        </button>
                    </div>
                </div >
            </form>
        </div>
    );
};

export default EditProfile;