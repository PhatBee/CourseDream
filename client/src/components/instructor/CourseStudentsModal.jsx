import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCourseStudents } from '../../features/course/courseSlice';
import { X, Calendar, Award, Clock, Users } from 'lucide-react';
import Spinner from '../common/Spinner';
import Pagination from '../common/Pagination';

const CourseStudentsModal = ({ isOpen, onClose, courseId, courseTitle }) => {
  const dispatch = useDispatch();
  const { courseStudents, courseStudentsPagination, isStudentsLoading } = useSelector((s) => s.course);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isOpen && courseId) {
      dispatch(getCourseStudents({ courseId, params: { page, limit: 7 } }));
    }
  }, [dispatch, isOpen, courseId, page]);

  // Reset page to 1 when modal opens for a new course
  useEffect(() => {
    if (isOpen) {
      setPage(1);
    }
  }, [isOpen, courseId]);

  if (!isOpen) return null;

  // Date Formatter (DD/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return '--/--/----';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '--/--/----';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Activity Date Time Ago Formatter
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Chưa có hoạt động';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Chưa có hoạt động';
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Vừa xong';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;

    // Fallback to exact date if >7 days
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderAvatar = (student) => {
    if (student?.avatar) {
      return (
        <img
          src={student.avatar}
          alt={student.name}
          className="w-10 h-10 rounded-full object-cover border border-gray-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/default-avatar.svg';
          }}
        />
      );
    }
    const initial = student?.name ? student.name.charAt(0).toUpperCase() : '?';
    const charCode = initial.charCodeAt(0) || 0;
    const colors = [
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-teal-100 text-teal-700 border-teal-200',
    ];
    const colorClass = colors[charCode % colors.length];

    return (
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm shadow-sm ${colorClass}`}>
        {initial}
      </div>
    );
  };

  const renderSkeletons = () => {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
              <div>
                <div className="w-32 h-4 bg-gray-100 rounded mb-1.5"></div>
                <div className="w-24 h-3 bg-gray-50 rounded"></div>
              </div>
            </div>
            <div className="w-20 h-4 bg-gray-50 rounded"></div>
            <div className="w-32 h-3 bg-gray-100 rounded-full"></div>
            <div className="w-24 h-4 bg-gray-50 rounded"></div>
          </div>
        ))}
      </div>
    );
  };

  const totalPages = courseStudentsPagination?.totalPages || 1;
  const totalItems = courseStudentsPagination?.totalItems || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-none">Học viên đã đăng ký</h2>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1 max-w-[500px]" title={courseTitle}>
                Khóa học: <span className="font-bold text-gray-600">{courseTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {isStudentsLoading ? (
            renderSkeletons()
          ) : courseStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50">
                    <th className="py-3.5 px-4 rounded-l-xl">Học viên</th>
                    <th className="py-3.5 px-4"><div className="flex items-center gap-1"><Calendar size={13} /> Ngày đăng ký</div></th>
                    <th className="py-3.5 px-4"><div className="flex items-center gap-1"><Award size={13} /> Tiến độ học tập</div></th>
                    <th className="py-3.5 px-4 rounded-r-xl"><div className="flex items-center gap-1"><Clock size={13} /> Học gần nhất</div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {courseStudents.map((item) => (
                    <tr key={item.student?._id || Math.random()} className="hover:bg-gray-50/50 transition-colors group">
                      {/* Student Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {renderAvatar(item.student)}
                          <div>
                            <p className="font-bold text-gray-800 leading-tight group-hover:text-rose-600 transition-colors">
                              {item.student?.name || 'Học viên ẩn danh'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.student?.email || 'Chưa cung cấp email'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Enrolled At */}
                      <td className="py-3.5 px-4 text-gray-500 font-medium">
                        {formatDate(item.enrolledAt)}
                      </td>

                      {/* Progress Bar & percentage */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 max-w-[180px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${item.progress?.percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-10 text-right">
                            {item.progress?.percentage || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Last active relative date */}
                      <td className="py-3.5 px-4 text-gray-600 font-semibold">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          {formatTimeAgo(item.progress?.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4 border border-dashed border-gray-200">
                <Users size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-700 mb-1">Chưa có học viên</h3>
              <p className="text-xs text-gray-400 max-w-[280px]">Chưa có học viên nào đăng ký tham gia khóa học này.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {totalPages > 1 && (
          <div className="px-6 pb-6 bg-gray-50/50 -mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStudentsModal;
