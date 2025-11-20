// src/components/profile/EditProfile.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, reset } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';

const EditProfile = () => {
    const dispatch = useDispatch();
    const { user, isLoading, isError, message } = useSelector((state) => state.auth);

    // State cho các trường text
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');

    // State cho xử lý ảnh
    const [avatarFile, setAvatarFile] = useState(null); // File người dùng chọn
    const [preview, setPreview] = useState('');         // URL để hiển thị xem trước
    const [deleteAvatar, setDeleteAvatar] = useState(false); // Cờ đánh dấu xóa ảnh

    // 1. Tải dữ liệu user vào form
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setBio(user.bio || '');
            setPhone(user.phone || '');
            // Chỉ set preview từ user.avatar nếu chưa có file mới được chọn
            if (!avatarFile) {
                setPreview(user.avatar || 'https://via.placeholder.com/150');
            }
        }
    }, [user, avatarFile]);

    // 2. Xử lý phản hồi từ Redux
    useEffect(() => {
        if (isError && message) {
            toast.error(message);
        }
        // Kiểm tra message thành công (hoặc dùng isSuccess nếu bạn có thêm vào slice)
        if (!isLoading && !isError && message && message.includes('thành công')) {
            toast.success(message);
            // Reset file input sau khi thành công
            setAvatarFile(null);
            setDeleteAvatar(false);
        }
        dispatch(reset());
    }, [isError, message, dispatch, isLoading]);

    // Xử lý khi chọn file
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Kiểm tra dung lượng (ví dụ 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
                return;
            }
            setAvatarFile(file);
            setDeleteAvatar(false); // Bỏ cờ xóa nếu chọn ảnh mới
            // Tạo URL xem trước
            setPreview(URL.createObjectURL(file));
        }
    };

    // Xử lý nút "Xóa ảnh"
    const handleDeleteAvatar = () => {
        setAvatarFile(null);
        setDeleteAvatar(true);
        setPreview('https://via.placeholder.com/150'); // Về ảnh mặc định
    };

    const onSubmit = (e) => {
        e.preventDefault();

        // CHUẨN BỊ FORMDATA
        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('phone', phone);

        if (deleteAvatar) {
            formData.append('deleteAvatar', 'true');
        } else if (avatarFile) {
            formData.append('avatar', avatarFile); // 'avatar' phải khớp với upload.single('avatar')
        }

        dispatch(updateProfile(formData));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Edit Profile</h2>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group">
                        <img
                            src={preview}
                            alt="Avatar Preview"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            {/* Input File ẩn, dùng label để kích hoạt */}
                            <label className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 cursor-pointer transition">
                                Change Photo
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </label>

                            <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:text-red-600 transition"
                            >
                                Remove
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Allowed JPG, GIF or PNG. Max size of 2MB</p>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                    </label>
                    <textarea
                        rows="4"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
                        placeholder="Tell something about yourself..."
                    ></textarea>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        {isLoading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                        )}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;