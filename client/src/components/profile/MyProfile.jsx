// src/pages/MyProfile.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { getProfile } from '../../features/auth/authSlice';
import { useEffect } from 'react';

// Component con để hiển thị thông tin
const InfoItem = ({ label, value }) => (
    <div className="mb-4">
        <h6 className="text-sm font-semibold text-gray-500 uppercase">{label}</h6>
        <span className="text-gray-800">{value || 'N/A'}</span>
    </div>
);

const formatDate = (ts) => {
    if (!ts) return 'N/A';

    const date = new Date(ts);
    if (isNaN(date.getTime())) return "N/A";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} - ${hour}:${minute}`;
};

const MyProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    if (!user) return null;

    return (
        <div className="bg-white p-5 rounded-lg shadow-md text-left">
            {/* Header (My Profile + Nút Edit) */}
            <div className="flex justify-between items-center mb-6">
                <h5 className="text-xl font-bold text-gray-800">My Profile</h5>
                <Link
                    to="/profile/settings/edit" // <-- Link tới trang Edit
                    className="text-gray-500 hover:text-blue-600"
                >
                    <Edit2 size={18} />
                </Link>
            </div>

            {/* Basic Information */}
            <div>
                <h6 className="text-lg font-semibold text-gray-700 mb-4">Basic Information</h6>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoItem label="Full Name" value={user.name} />
                    {/* (Các trường First/Last Name đã bị bỏ) */}
                    <InfoItem
                        label="Registration Date"
                        value={formatDate(user.createdAt)} // <-- Dùng hàm của bà
                    />
                    <InfoItem label="Email" value={user.email} />
                    <InfoItem label="Phone Number" value={user.phone} />
                </div>
                <div className="mt-4">
                    <InfoItem label="Bio" value={user.bio} />
                </div>
            </div>
        </div>
    );
};

export default MyProfile;