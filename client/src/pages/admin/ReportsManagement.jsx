import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReports, fetchReportDetail } from "../../features/report/reportSlice";
import Pagination from "../../components/common/Pagination";
import { Eye, Filter } from "lucide-react";
import ReportDetailModal from "./ReportDetailModal";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  reviewed: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const ReportsManagement = () => {
  const dispatch = useDispatch();
  const { list: reportsRaw = [], loading, pagination } = useSelector((state) => state.report);
  const reports = Array.isArray(reportsRaw) ? reportsRaw : [];
  const [filters, setFilters] = useState({ status: "", type: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    dispatch(fetchReports({ ...filters, page: currentPage }));
  }, [dispatch, filters, currentPage]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleViewDetail = (report) => {
    dispatch(fetchReportDetail(report._id));
    setSelectedReport(report._id);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedReport(null);
  };

  return (
    <div className="space-y-6 font-inter text-left">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý báo cáo</h1>
        {/* Bộ lọc */}
        <div className="flex gap-2 items-center">
          <Filter size={18} className="text-gray-400" />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="reviewed">Đã xem</option>
            <option value="resolved">Đã xử lý</option>
            <option value="rejected">Từ chối</option>
          </select>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filters.type}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          >
            <option value="">Tất cả loại</option>
            <option value="course">Khóa học</option>
            <option value="discussion">Thảo luận</option>
            <option value="reply">Bình luận</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Loại</th>
                <th className="px-6 py-4">Đối tượng</th>
                <th className="px-6 py-4">Người báo cáo</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">
                    Không có báo cáo nào.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 capitalize">
                    {r.type === "course" && "Khóa học"}
                    {r.type === "discussion" && "Thảo luận"}
                    {r.type === "reply" && "Bình luận"}
                  </td>
                  <td className="px-6 py-4">{r.course?.title || "—"}</td>
                  <td className="px-6 py-4">{r.reporter?.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[r.status] || "bg-gray-100 text-gray-700"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                      onClick={() => handleViewDetail(r)}
                    >
                      <Eye size={16} /> Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
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

      {/* Modal chi tiết báo cáo */}
      {showDetail && <ReportDetailModal reportId={selectedReport} onClose={handleCloseDetail} />}
    </div>
  );
};

export default ReportsManagement;