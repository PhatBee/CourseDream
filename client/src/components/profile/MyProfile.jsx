import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Edit, Calendar, Mail, Phone, User as UserIcon } from 'lucide-react';
import { getProfile } from '../../features/auth/authSlice';

// Helper format date
const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const date = new Date(ts);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit'
    });
};

const InfoCard = ({ icon, label, value }) => (
    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-lg text-gray-400 group-hover:text-rose-500 shadow-sm transition-colors">
                {icon}
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-gray-800 font-semibold pl-1">{value || 'Not provided'}</p>
    </div>
);

const MyProfile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getProfile());
    }, [dispatch]);

    if (!user) return null;

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 text-left">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
                </div>
                <Link
                    to="/profile/settings/edit"
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Edit Profile"
                >
                    <Edit size={20} />
                </Link>
            </div>

            {/* Thông tin chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <InfoCard 
                    icon={<UserIcon size={18} />} 
                    label="Full Name" 
                    value={user.name} 
                />
                <InfoCard 
                    icon={<Calendar size={18} />} 
                    label="Registration Date" 
                    value={formatDate(user.createdAt)} 
                />
                <InfoCard 
                    icon={<Mail size={18} />} 
                    label="Email Address" 
                    value={user.email} 
                />
                <InfoCard 
                    icon={<Phone size={18} />} 
                    label="Phone Number" 
                    value={user.phone} 
                />
            </div>

            {/* Bio Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h6 className="text-sm font-bold text-gray-800 mb-3">Bio</h6>
                <p className="text-gray-600 leading-relaxed text-sm">
                    {user.bio || "No bio information provided yet. Click edit to introduce yourself!"}
                </p>
            </div>
        </div>
    );
};

export default MyProfile;