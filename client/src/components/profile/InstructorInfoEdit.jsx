import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorProfile, updateInstructorData, resetInstructorState } from '../../features/instructor/instructorSlice';
import { toast } from 'react-hot-toast';

const InstructorInfoEdit = () => {
    const dispatch = useDispatch();
    const { instructorProfile, isLoading, isSuccess, isError, message } = useSelector((state) => state.instructor);

    const [formData, setFormData] = useState({
        headline: '',
        experience: '',
        education: '',
        specialties: ''
    });

    // 1. Fetch data khi mount
    useEffect(() => {
        dispatch(fetchInstructorProfile());
    }, [dispatch]);

    // 2. Fill data vào form khi có profile
    useEffect(() => {
        if (instructorProfile) {
            setFormData({
                headline: instructorProfile.headline || '',
                experience: instructorProfile.experience || '',
                education: instructorProfile.education || '',
                specialties: instructorProfile.specialties ? instructorProfile.specialties.join(', ') : ''
            });
        }
    }, [instructorProfile]);

    // 3. Xử lý thông báo
    useEffect(() => {
        if (isError && message) {
            toast.error(message);
            dispatch(resetInstructorState());
        }
        if (isSuccess && message) {
            toast.success(message);
            dispatch(resetInstructorState());
        }
    }, [isError, isSuccess, message, dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = (e) => {
        e.preventDefault();
        // Chuyển specialties từ string sang array
        const submitData = {
            ...formData,
            specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
        };
        dispatch(updateInstructorData(submitData));
    };

    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-8 text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Instructor Profile</h3>
            <p className="text-sm text-gray-500 mb-6">Manage your public instructor profile details</p>

            <form onSubmit={onSubmit} className="space-y-6">
                
                {/* Headline */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
                    <input 
                        type="text" 
                        name="headline"
                        value={formData.headline} 
                        onChange={handleChange}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" 
                    />
                </div>

                {/* Specialties */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Specialties</label>
                    <input 
                        type="text" 
                        name="specialties"
                        value={formData.specialties} 
                        onChange={handleChange}
                        placeholder="e.g. React, Nodejs, Python (comma separated)"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition" 
                    />
                </div>

                {/* Experience */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience</label>
                    <textarea 
                        rows="4" 
                        name="experience"
                        value={formData.experience} 
                        onChange={handleChange}
                        placeholder="Describe your work experience..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition"
                    ></textarea>
                </div>

                {/* Education */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Education</label>
                    <textarea 
                        rows="3" 
                        name="education"
                        value={formData.education} 
                        onChange={handleChange}
                        placeholder="Degrees, Certifications..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-rose-100 focus:border-rose-400 outline-none transition"
                    ></textarea>
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={isLoading} className="px-8 py-3 bg-rose-500 text-white rounded-lg font-bold hover:bg-rose-600 transition shadow-lg shadow-rose-200 disabled:opacity-70">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InstructorInfoEdit;