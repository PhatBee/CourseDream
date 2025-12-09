import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import Pagination from '../../components/common/Pagination';
import ApplicationDetailModal from '../../components/admin/ApplicationDetailModal';
import { toast, Toaster } from 'react-hot-toast';
import { Search, Eye } from 'lucide-react';
import Spinner from '../../components/common/Spinner';

const InstructorsManagement = () => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' (All Instructors) | 'pending' (Applications)
    
    // State for Applications
    const [applications, setApplications] = useState([]);
    const [appLoading, setAppLoading] = useState(false);
    const [appPage, setAppPage] = useState(1);
    const [appPagination, setAppPagination] = useState({});
    
    // Modal State
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch Applications Data
    const fetchApplications = async () => {
        setAppLoading(true);
        try {
            const res = await adminApi.getInstructorApplications({ page: appPage, status: 'pending' });
            setApplications(res.data.data.applications);
            setAppPagination(res.data.data.pagination);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setAppLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchApplications();
        }
        // Logic fetch for 'list' tab (instructors) can be added similarly
    }, [activeTab, appPage]);

    // Handle Review Action
    const handleReview = async (id, action, reason) => {
        try {
            await adminApi.reviewInstructorApplication(id, { action, reason });
            toast.success(action === 'approve' ? "Instructor Approved!" : "Application Rejected");
            setIsModalOpen(false);
            fetchApplications(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || "Action failed");
        }
    };

    const openModal = (app) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" />
            
            <div className="flex justify-between items-end">
                <h1 className="text-2xl font-bold text-gray-800">Instructors Management</h1>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
                            activeTab === 'list' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        All Instructors
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                            activeTab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Pending Applications
                        {/* Optional: Add badge count if available */}
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {activeTab === 'pending' && (
                        <>
                            {appLoading ? (
                                <div className="flex justify-center py-10"><Spinner /></div>
                            ) : applications.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                                                <th className="px-4 py-3 font-semibold">Applicant</th>
                                                <th className="px-4 py-3 font-semibold">Email</th>
                                                <th className="px-4 py-3 font-semibold">Submitted Date</th>
                                                <th className="px-4 py-3 font-semibold text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {applications.map((app) => (
                                                <tr key={app._id} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <img src={app.user?.avatar || "/default-avatar.png"} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            <span className="font-medium text-gray-900">{app.user?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 text-sm">{app.user?.email}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-sm">
                                                        {new Date(app.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button 
                                                            onClick={() => openModal(app)}
                                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ml-auto"
                                                        >
                                                            <Eye size={16} /> Review
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <Pagination 
                                        currentPage={appPagination.page} 
                                        totalPages={appPagination.totalPages} 
                                        onPageChange={setAppPage} 
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500">No pending applications found.</div>
                            )}
                        </>
                    )}

                    {activeTab === 'list' && (
                        <div className="text-center py-10 text-gray-400">
                            {/* Implement list of current instructors here similar to Users/Students table */}
                            List of approved instructors will be displayed here.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <ApplicationDetailModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                application={selectedApp}
                onReview={handleReview}
            />
        </div>
    );
};

export default InstructorsManagement;