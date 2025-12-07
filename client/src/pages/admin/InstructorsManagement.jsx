import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructors, toggleBlockUser } from '../../features/admin/adminSlice';
import { Search, MoreVertical, Mail, Phone, BookOpen, Users, Award } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import defaultAvatar from '../../assets/img/icons/apple-icon.png';
import ActionMenu from '../../components/admin/common/ActionMenu';
import BanUserModal from '../../components/admin/user/BanUserModal';
import { toast } from 'react-toastify';

const InstructorsManagement = () => {
  const dispatch = useDispatch();
  const { instructorsList, isLoading } = useSelector((state) => state.admin);
  const { data: instructors, pagination } = instructorsList;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchInstructors({ page: currentPage, search: searchTerm }));
    }, 500);
    return () => clearTimeout(timer);
  }, [dispatch, currentPage, searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openToggleBlockModal = (user) => {
    setSelectedUser(user);
    setIsBanning(user.isActive);
    setIsBanModalOpen(true);
  };

  const handleConfirmToggleBlock = async (userId, reason) => {
    try {
      const result = await dispatch(toggleBlockUser({ userId, reason })).unwrap();
      toast.success(result.message);
      setIsBanModalOpen(false);
      dispatch(fetchStudents({ page: currentPage, search: searchTerm }));
    } catch (error) {
      toast.error("Hành động thất bại: " + error);
    }
  };

  return (
    <div className="space-y-6 font-inter">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* <div>
          <h2 className="text-2xl font-bold text-gray-800">Instructors List</h2>
          <p className="text-sm text-gray-500">Manage your teaching staff</p>
        </div> */}
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search instructor..." 
            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* 2. Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Instructor</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Expertise</th>
                <th className="px-6 py-4 text-center">Stats</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {instructors.map((inst) => (
                <tr key={inst._id} className="hover:bg-gray-50/50 transition-colors group">
                  
                  {/* Avatar & Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={inst.avatar || defaultAvatar} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{inst.name}</p>
                        <p className="text-xs text-gray-400">Joined: {new Date(inst.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{inst.email}</span>
                      </div>
                      {inst.phone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone size={14} className="text-gray-400" />
                          <span>{inst.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Expertise (Chuyên môn) */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {inst.expertise && inst.expertise.length > 0 ? (
                        inst.expertise.slice(0, 2).map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic">Not updated</span>
                      )}
                    </div>
                  </td>

                  {/* Stats (Số khóa học / Học viên) */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center" title="Courses Created">
                        <BookOpen size={14} className="text-gray-400 mx-auto mt-0.5" />
                        <span className="block font-bold text-gray-800">{inst.stats?.courses || 0}</span>
                      </div>
                      <div className="w-[1px] h-6 bg-gray-200"></div>
                      <div className="text-center" title="Total Students">
                        <Users size={14} className="text-gray-400 mx-auto mt-0.5" />
                        <span className="block font-bold text-gray-800">{inst.stats?.students || 0}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {inst.isBlocked ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <ActionMenu 
                      user={inst} 
                      onToggleBlock={() => openToggleBlockModal(inst)}
                    />
                  </td>
                </tr>
              ))}

              {instructors.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    No instructors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 pb-6">
          <Pagination 
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        onConfirm={handleConfirmToggleBlock}
        user={selectedUser}
        isBanning={isBanning}
      />
    </div>
  );
};

export default InstructorsManagement;