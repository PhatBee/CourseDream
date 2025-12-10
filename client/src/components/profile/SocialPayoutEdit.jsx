import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorProfile, updateInstructorData, resetInstructorState } from '../../features/instructor/instructorSlice';
import { toast } from 'react-hot-toast';
import { Globe, Facebook, Youtube, Linkedin, Twitter, CreditCard } from 'lucide-react';

const SocialPayoutEdit = () => {
    const dispatch = useDispatch();
    const { instructorProfile, isLoading, isSuccess, isError, message } = useSelector((state) => state.instructor);

    const [socials, setSocials] = useState({ website: '', facebook: '', youtube: '', linkedin: '', twitter: '' });
    const [payout, setPayout] = useState({ bankName: '', bankAccount: '', paypalEmail: '' });

    useEffect(() => { dispatch(fetchInstructorProfile()); }, [dispatch]);

    useEffect(() => {
        if (instructorProfile) {
            setSocials({ ...instructorProfile.socialLinks });
            setPayout({ ...instructorProfile.payout });
        }
    }, [instructorProfile]);

    useEffect(() => {
        if (isError && message) { toast.error(message); dispatch(resetInstructorState()); }
        if (isSuccess && message) { toast.success(message); dispatch(resetInstructorState()); }
    }, [isError, isSuccess, message, dispatch]);

    const handleSocialChange = (e) => setSocials({ ...socials, [e.target.name]: e.target.value });
    const handlePayoutChange = (e) => setPayout({ ...payout, [e.target.name]: e.target.value });

    const onSubmit = (e) => {
        e.preventDefault();
        dispatch(updateInstructorData({
            socialLinks: socials,
            payout: payout
        }));
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 text-left">
            <form onSubmit={onSubmit} className="space-y-8">
                
                {/* Social Links Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">Social Profiles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <Globe size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="text" name="website" value={socials.website || ''} onChange={handleSocialChange} placeholder="Website URL" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                        <div className="relative">
                            <Facebook size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="text" name="facebook" value={socials.facebook || ''} onChange={handleSocialChange} placeholder="Facebook Username" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                        <div className="relative">
                            <Youtube size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="text" name="youtube" value={socials.youtube || ''} onChange={handleSocialChange} placeholder="YouTube Channel" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                        <div className="relative">
                            <Linkedin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input type="text" name="linkedin" value={socials.linkedin || ''} onChange={handleSocialChange} placeholder="LinkedIn Profile" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                    </div>
                </div>

                {/* Payout Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                        <CreditCard size={20} /> Payout Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                            <input type="text" name="bankName" value={payout.bankName || ''} onChange={handlePayoutChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                            <input type="text" name="bankAccount" value={payout.bankAccount || ''} onChange={handlePayoutChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">PayPal Email (Optional)</label>
                            <input type="email" name="paypalEmail" value={payout.paypalEmail || ''} onChange={handlePayoutChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={isLoading} className="px-8 py-3 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-200 disabled:opacity-70">
                        {isLoading ? 'Saving...' : 'Save Information'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SocialPayoutEdit;