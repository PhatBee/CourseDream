// src/pages/admin/InstructorApplications.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorApplications, reviewInstructorApp } from '../../features/admin/adminSlice';
import Pagination from '../../components/common/Pagination';
import ApplicationDetailModal from '../../components/admin/ApplicationDetailModal';
import { Eye, Clock } from 'lucide-react';
import Spinner from '../../components/common/Spinner';

const InstructorApplications = () => {
    const dispatch = useDispatch();
    const { adminApplications, adminAppPagination, isLoading } = useSelector(state => state.admin);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        dispatch(fetchInstructorApplications({ page: currentPage, status: 'pending' }));
    }, [dispatch, currentPage]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const openModal = (app) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    const handleReview = async (id, action, reason) => {
        setIsProcessing(true);
        await dispatch(reviewInstructorApp({ id, action, reason }));
        setIsProcessing(false);
        setIsModalOpen(false);
    };

    if (isLoading && adminApplications.length === 0) return <div className="py-10 flex justify-center"><Spinner /></div>;

    return (
        <div>
            {/* Table */}
            {adminApplications.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                                <th className="px-6 py-4 font-semibold">Ứng viên</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Ngày đăng ký</th>
                                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {adminApplications.map((app) => (
                                <tr key={app._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={app.user?.avatar || "/default-user.png"} 
                                                alt="" 
                                                className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                                            />
                                            <span className="font-medium text-gray-900">{app.user?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">{app.user?.email}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => openModal(app)}
                                            className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-1 ml-auto border border-blue-200"
                                        >
                                            <Eye size={16} /> Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">Không có đơn đăng ký nào</h3>
                    <p className="text-gray-500">Hiện tại chưa có học viên nào đăng ký làm giảng viên.</p>
                </div>
            )}

            {/* Pagination */}
            <Pagination 
                currentPage={adminAppPagination.page} 
                totalPages={adminAppPagination.totalPages} 
                onPageChange={handlePageChange} 
            />

            {/* Modal */}
            <ApplicationDetailModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                application={selectedApp}
                onReview={handleReview}
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default InstructorApplications;