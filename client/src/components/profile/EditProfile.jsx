// src/components/profile/EditProfile.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, reset, getProfile } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';

const EditProfile = () => {
    const dispatch = useDispatch();
    const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

    const [name, setName] = useState('');

    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');

    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [deleteAvatar, setDeleteAvatar] = useState(false);

    useEffect(() => { dispatch(getProfile()); }, [dispatch]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setBio(user.bio || '');
            setPhone(user.phone || '');
            if (!avatarFile) setPreview(user.avatar || 'https://via.placeholder.com/150');
        }
    }, [user, avatarFile]);

    // useEffect(() => {
    //     if (isError && message) toast.error(message);
    //     if (!isLoading && !isError && message && message.includes('thành công')) {
    //         toast.success(message);
    //         setAvatarFile(null);
    //         setDeleteAvatar(false);
    //     }
    //     dispatch(reset());
    // }, [isError, message, dispatch, isLoading]);

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
            dispatch(reset()); // Reset ngay sau khi hiện thông báo lỗi
        }

        // Check bằng flag isSuccess chuẩn xác hơn
        if (isSuccess && message) {
            toast.success(message);
            setAvatarFile(null);
            setDeleteAvatar(false);
            dispatch(reset()); // Reset state để tắt cờ isSuccess, tránh toast hiện lại
        }
    }, [isError, isSuccess, message, dispatch]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {

            // Kiểm tra dung lượng (ví dụ 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
                return;
            }

            setAvatarFile(file);
            setDeleteAvatar(false);
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
        const formData = new FormData();
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('phone', phone);
        if (deleteAvatar) formData.append('deleteAvatar', 'true');
        else if (avatarFile) formData.append('avatar', avatarFile);
        dispatch(updateProfile(formData));
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 text-left">

            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8">
                <img src={preview} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                <div>
                    <h5 className="font-bold text-gray-800 text-lg">Profile Photo</h5>
                    <p className="text-sm text-gray-500 mb-3">Allowed JPG, GIF or PNG. Max size of 2MB</p>
                    <div className="flex gap-3">
                        <label className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 cursor-pointer transition">
                            Upload
                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                        <button
                            type="button"
                            onClick={handleDeleteAvatar}
                            className="px-4 py-1.5 bg-rose-50 text-rose-500 rounded text-sm font-medium hover:bg-rose-100 transition"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="border-b border-gray-100 pb-4 mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Personal Details</h3>
                    <p className="text-sm text-gray-500">Edit your personal information</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                        <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio <span className="text-red-500">*</span></label>
                    <textarea rows="4" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition"></textarea>
                </div>

                {/* Button */}
                <div className="pt-4">
                    <button type="submit" disabled={isLoading} className="px-8 py-3 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-200 disabled:opacity-70">
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;