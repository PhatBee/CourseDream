import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReportDetail, resolveReport, fetchReports } from "../../features/report/reportSlice";
import { XCircle, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

const ACTIONS_BY_TYPE = {
  course: [
    { value: "warn", label: "Cảnh cáo" },
    { value: "hide_course", label: "Ẩn khóa học" },
    { value: "ban_user", label: "Khóa tài khoản" }
  ],
  discussion: [
    { value: "warn", label: "Cảnh cáo" },
    { value: "lock_comment", label: "Khóa bình luận" },
    { value: "ban_user", label: "Khóa tài khoản" }
  ],
  reply: [
    { value: "warn", label: "Cảnh cáo" },
    { value: "lock_comment", label: "Khóa bình luận" },
    { value: "ban_user", label: "Khóa tài khoản" }
  ]
};

const InfoRow = ({ label, children }) => (
  <div className="flex items-start gap-2 mb-2">
    <span className="min-w-[120px] font-semibold text-gray-700">{label}:</span>
    <span className="flex-1">{children}</span>
  </div>
);

const ReportDetailModal = ({ reportId, onClose }) => {
  const dispatch = useDispatch();
  const { detail: report, history = [] } = useSelector((state) => state.report);
  const [status, setStatus] = useState("resolved");
  const [adminNote, setAdminNote] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    if (reportId) dispatch(fetchReportDetail(reportId));
  }, [dispatch, reportId]);

  if (!report) return null;

  const isFinalized = report.status === "resolved" || report.status === "rejected";

  const handleResolve = async () => {
    const result = await dispatch(resolveReport({ id: reportId, status, adminNote, action }));
    if (resolveReport.fulfilled.match(result)) {
      dispatch(fetchReportDetail(reportId));
      dispatch(fetchReports());
      onClose();
    }
    toast.success("Đã xử lý báo cáo!");
  };

  // Tối ưu hiển thị đối tượng báo cáo
  let objectDetail = null;
  if (report.type === "course" && report.course) {
    objectDetail = (
      <InfoRow label="Khóa học">
        <a
          href={`/courses/${report.course.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline font-medium"
        >
          {report.course.title}
        </a>
      </InfoRow>
    );
  }
  if (report.type === "discussion" && report.discussion) {
    objectDetail = (
      <InfoRow label="Thảo luận">
        <span className="italic text-gray-700">"{report.discussion.content}"</span>
        {report.course?.slug && (
          <a
            href={`/courses/${report.course.slug}?discussion=${report.discussion._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline"
          >
            Xem thảo luận
          </a>
        )}
      </InfoRow>
    );
  }
  if (report.type === "reply" && (report.replyObj || report.reply)) {
    objectDetail = (
      <InfoRow label="Bình luận">
        <span className="italic text-gray-700">
          "{report.replyObj?.content || report.reply?.content || "Không tìm thấy nội dung"}"
        </span>
        {report.course?.slug && report.discussion?._id && (
          <a
            href={`/courses/${report.course.slug}?discussion=${report.discussion._id}&reply=${report.replyObj?._id || report.reply?._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-600 underline"
          >
            Xem bình luận
          </a>
        )}
      </InfoRow>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn relative">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700" onClick={onClose}>
          <XCircle size={24} />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-rose-600">Chi tiết báo cáo</h2>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
            <InfoRow label="Người gửi">
              <span className="font-medium">{report.reporter?.name}</span>
            </InfoRow>
            <InfoRow label="Lý do">
              <span>{report.reason}</span>
            </InfoRow>
            {objectDetail}
            <InfoRow label="Người bị báo cáo">
              <span>{report.reportedUser?.name || "—"}</span>
            </InfoRow>
            <InfoRow label="Trạng thái">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                ${report.status === "resolved" ? "bg-green-100 text-green-700" :
                  report.status === "rejected" ? "bg-red-100 text-red-700" :
                  report.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"}`}>
                {report.status}
              </span>
            </InfoRow>
            <InfoRow label="Ngày gửi">
              <span>{new Date(report.createdAt).toLocaleString("vi-VN")}</span>
            </InfoRow>
          </div>

          <div className="mb-4">
            <b>Lịch sử vi phạm:</b>
            <ul className="list-disc ml-6 text-sm mt-1">
              {history.length === 0 && <li>Không có</li>}
              {history.map((h) => (
                <li key={h._id}>
                  {h.reason} ({new Date(h.createdAt).toLocaleDateString("vi-VN")})
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <b>Xử lý báo cáo:</b>
            <div className="flex gap-2 mt-1">
              <select
                className={`border rounded px-2 py-1 ${isFinalized ? "opacity-50 cursor-not-allowed" : ""}`}
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={isFinalized}
              >
                <option value="resolved">Đã xử lý</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select
                className={`border rounded px-2 py-1 ${status === "rejected" || isFinalized ? "opacity-50 cursor-not-allowed" : ""}`}
                value={action}
                onChange={e => setAction(e.target.value)}
                disabled={status === "rejected" || isFinalized}
              >
                <option value="">Chọn biện pháp</option>
                {ACTIONS_BY_TYPE[report.type]?.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <textarea
              className="w-full border rounded px-2 py-1 mt-2"
              placeholder="Ghi chú cho admin hoặc lý do xử lý..."
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              disabled={isFinalized}
            />
            <button
              className={`mt-3 px-4 py-2 rounded transition w-full ${
                isFinalized
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
              onClick={handleResolve}
              disabled={isFinalized}
            >
              {isFinalized
                ? <><CheckCircle size={18} className="inline mr-1" /> Đã xử lý</>
                : <><CheckCircle size={18} className="inline mr-1" /> Xác nhận xử lý</>
              }
            </button>
          </div>

          <div>
            <b>Lịch sử xử lý:</b>
            <ul className="list-disc ml-6 text-sm mt-1">
              {report.actions?.length === 0 && <li>Chưa có</li>}
              {report.actions?.map((a, idx) => (
                <li key={idx}>
                  {a.action} - {a.note} ({new Date(a.at).toLocaleString("vi-VN")})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;