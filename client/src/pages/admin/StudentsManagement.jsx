import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, toggleBlockUser } from '../../features/admin/adminSlice';
import { Search, MoreVertical, Mail, Phone, BookOpen, Calendar, Ban, CheckCircle } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import defaultAvatar from '../../assets/img/icons/apple-icon.png';
import { toast } from 'react-toastify';
import BanUserModal from '../../components/admin/user/BanUserModal';
import ActionMenu from '../../components/admin/common/ActionMenu';

const StudentsManagement = () => {
  const dispatch = useDispatch();
  const { studentsList, isLoading } = useSelector((state) => state.admin);
  const { data: students, pagination } = studentsList;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchStudents({ page: currentPage, search: searchTerm }));
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
    <div className="space-y-6 font-inter text-left">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative absolute right">
          <input
            type="text"
            placeholder="Search by name or email..."
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
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-center">Enrolled</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50/50 transition-colors group">

                  {/* Avatar & Name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.avatar || defaultAvatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{student.name}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} className="text-gray-400" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Phone size={14} className="text-gray-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Courses Enrolled */}
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-medium text-xs">
                      <BookOpen size={14} className="mr-1.5" />
                      {student.coursesEnrolled || 0}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(student.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {!student.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                        Banned
                      </span>
                    ) : student.isVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        Unverified
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <ActionMenu
                      user={student}
                      onToggleBlock={() => openToggleBlockModal(student)}
                      onViewDetails={() => navigate(`/admin/users/${student._id}`)}
                    />
                  </td>
                </tr>
              ))}

              {students.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    No students found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination */}
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

export default StudentsManagement;