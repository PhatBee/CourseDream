import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  resolveReport,
  fetchReportDetail,
} from "../../features/report/reportSlice";
import {
  X,
  ShieldAlert,
  CheckCircle,
  AlertOctagon,
  History,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";

const ACTIONS_BY_TYPE = {
  course: [
    { value: "warn", label: "Cảnh cáo nhắc nhở" },
    { value: "hide_course", label: "Ẩn khóa học" },
    { value: "ban_user", label: "Khóa/Đình chỉ tài khoản" },
  ],
  discussion: [
    { value: "warn", label: "Cảnh cáo nhắc nhở" },
    { value: "lock_comment", label: "Khóa/Gỡ bình luận" },
    { value: "ban_user", label: "Khóa/Đình chỉ tài khoản" },
  ],
  reply: [
    { value: "warn", label: "Cảnh cáo nhắc nhở" },
    { value: "lock_comment", label: "Khóa/Gỡ bình luận" },
    { value: "ban_user", label: "Khóa/Đình chỉ tài khoản" },
  ],
};

// Map Enum thành Label tiếng Việt hiển thị
const REASON_LABELS = {
  SPAM: "Spam / Quảng cáo",
  INAPPROPRIATE_CONTENT: "Nội dung vi phạm / Không phù hợp",
  COPYRIGHT_VIOLATION: "Vi phạm bản quyền",
  FRAUD: "Lừa đảo / Sai sự thật",
  HARASSMENT: "Hành vi / Lời lẽ quấy rối",
  OTHER: "Lý do khác",
};

const InfoRow = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
    {/* Cho shrink-0 và fix cứng size trên mobile để không cong vênh */}
    <span className="shrink-0 w-full sm:w-[140px] text-sm font-semibold text-gray-500 uppercase tracking-wide pt-0.5">
      {label}
    </span>
    {/* min-w-0 và break-words giúp triệt tiêu triệt để overflow */}
    <span
      className="flex-1 min-w-0 text-gray-800 break-words"
      style={{ overflowWrap: "anywhere" }}
    >
      {children}
    </span>
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

  const isFinalized =
    report.status === "resolved" || report.status === "rejected";

  const handleResolve = async () => {
    if (!action && status !== "rejected") {
      toast.error(
        "Vui lòng chọn biện pháp xử lý hoặc đổi trạng thái thành Từ chối",
      );
      return;
    }
    if (!adminNote) {
      toast.error("Vui lòng nhập ghi chú hoặc lý do xử lý");
      return;
    }
    const resultAction = await dispatch(
      resolveReport({ id: report._id, status, adminNote, action }),
    );

    if (resolveReport.fulfilled.match(resultAction)) {
      toast.success("Xử lý báo cáo thành công");
      onClose(true);
    } else {
      toast.error(`Lỗi: ${resultAction.error.message || "Không thể xử lý"}`);
    }
  };

  // Helper xử lý URL gốc
  const getOriginalUrl = (courseSlug, lectureId, queryParams) => {
    const basePath = lectureId
      ? `/courses/${courseSlug}/learn/lecture/${lectureId}`
      : `/courses/${courseSlug}`; // Dự phòng nếu root là course
    return `${basePath}?${queryParams}`;
  };

  // Render Object Links
  let objectDetail = null;
  if (report.type === "course" && report.course) {
    objectDetail = (
      <InfoRow label="Khóa học">
        <a
          href={`/courses/${report.course.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-medium underline decoration-blue-300 underline-offset-2"
        >
          {report.course.title}
        </a>
      </InfoRow>
    );
  }
  if (report.type === "discussion" && report.discussion) {
    const highlightUrl = getOriginalUrl(
      report.course?.slug,
      report.discussion?.lectureId,
      `discussionId=${report.targetId}`,
    );

    objectDetail = (
      <InfoRow label="Thảo luận">
        <div className="bg-gray-100 p-3 rounded-lg text-sm border border-gray-200 italic mt-1 sm:mt-0">
          "{report.discussion.content}"
        </div>
        {report.course?.slug && (
          <a
            href={highlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            Thảo luận gốc ↗
          </a>
        )}
      </InfoRow>
    );
  }
  if (report.type === "reply" && (report.replyObj || report.reply)) {
    const textContent = report.replyObj?.content || report.reply;
    const highlightUrl = getOriginalUrl(
      report.course?.slug,
      report.discussion?.lectureId,
      `discussionId=${report.discussion._id}&replyId=${report.targetId}`,
    );

    objectDetail = (
      <InfoRow label="Bình luận">
        <div className="bg-gray-100 p-3 rounded-lg text-sm border border-gray-200 italic mt-1 sm:mt-0">
          "{textContent}"
        </div>
        {report.course?.slug && report.discussion?._id && (
          <a
            href={highlightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            Bình luận gốc ↗
          </a>
        )}
      </InfoRow>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-scaleIn relative flex flex-col max-h-[90vh]">
        <button
          className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-all z-10"
          onClick={onClose}
        >
          <X size={22} />
        </button>

        <div className="bg-gray-900 p-6 flex items-center gap-4 text-white shrink-0">
          <div className="bg-rose-500/20 p-3 rounded-xl">
            <ShieldAlert size={28} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide text-white">
              Xử lý báo cáo #
              {(report._id || "").substring(18, 24).toUpperCase()}
            </h2>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              Trạng thái:
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm inline-flex items-center gap-1
                  ${
                    report.status === "resolved"
                      ? "bg-green-500 text-white"
                      : report.status === "rejected"
                        ? "bg-gray-500 text-white"
                        : report.status === "pending"
                          ? "bg-amber-400 text-amber-950"
                          : "bg-blue-500 text-white"
                  }`}
              >
                {report.status === "resolved"
                  ? "Đã xử lý"
                  : report.status === "pending"
                    ? "Chờ xử lý"
                    : report.status}
              </span>
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Cột trái: Thông tin (Chiếm 3 phần / 5) */}
            <div className="space-y-6 lg:col-span-3">
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <AlertOctagon size={18} className="text-rose-500" /> Nội dung
                  Báo cáo
                </h3>
                <div className="space-y-1">
                  <InfoRow label="Người gửi báo cáo">
                    <span className="font-semibold text-gray-800">
                      {report.reporter?.name}
                    </span>
                  </InfoRow>
                  <InfoRow label="Thời gian nhận">
                    {new Date(report.createdAt).toLocaleString("vi-VN")}
                  </InfoRow>

                  <InfoRow label="Lý do vi phạm">
                    <span className="inline-flex py-1 px-2.5 bg-rose-100 text-rose-700 font-bold rounded-lg text-sm border border-rose-200 w-auto text-left inline-block">
                      {REASON_LABELS[report.reason] || report.reason}{" "}
                      {/* HIỂN THỊ TIẾNG VIỆT */}
                    </span>
                  </InfoRow>

                  {objectDetail}

                  <InfoRow label="Người vi phạm">
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {report.reportedUser?.name || "—"}
                    </span>
                  </InfoRow>
                  {report.description && (
                    <InfoRow label="Mô tả chi tiết">
                      <div className="text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100 select-all">
                        "{report.description}"
                      </div>
                    </InfoRow>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <History size={18} className="text-amber-500" /> Hồ sơ vi phạm
                  cũ của người bị báo cáo
                </h3>
                <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100/50">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {history.length === 0 ? (
                      <li className="text-gray-500 italic block min-w-0 break-words">
                        Tài khoản này chưa có vi phạm nào trước đây.
                      </li>
                    ) : (
                      history.map((h) => (
                        <li
                          key={h._id}
                          className="flex items-start gap-2 bg-white p-2 rounded shadow-sm border border-gray-100 min-w-0 break-words overflow-hidden"
                        >
                          <span className="text-rose-500 mt-0.5 shrink-0">
                            •
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800">
                              {REASON_LABELS[h.reason] || h.reason}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(h.createdAt).toLocaleDateString(
                                "vi-VN",
                              )}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cột phải: Control Panel (Chiếm 2 phần / 5) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm ring-1 ring-indigo-50">
                <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2 border-b pb-2">
                  <UserX size={18} className="text-indigo-500" /> Bảng Xử lý
                </h3>

                <div className="space-y-4">
                  {/* DROPDOWN KẾT LUẬN HIỆN ĐẠI HƠN */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Kết luận Báo cáo
                    </label>
                    <select
                      className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all ${isFinalized ? "bg-gray-100 opacity-80 cursor-not-allowed text-gray-500" : "bg-white cursor-pointer appearance-none"}`}
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isFinalized}
                    >
                      <option value="resolved">Tiếp nhận (Vi phạm đúng)</option>
                      <option value="rejected">
                        Từ chối (Báo cáo sai/Spam)
                      </option>
                    </select>
                    {!isFinalized && ( // Mũi tên giả lập cho select box
                      <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-4 text-gray-500">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* DROPDOWN BIỆN PHÁP HIỆN ĐẠI HƠN */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Biện pháp cưỡng chế
                    </label>
                    <select
                      className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all ${status === "rejected" || isFinalized ? "bg-gray-100 opacity-80 cursor-not-allowed text-gray-500" : "bg-white cursor-pointer appearance-none"}`}
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      disabled={status === "rejected" || isFinalized}
                    >
                      <option value="">-- Chọn hình thức kỷ luật --</option>
                      {ACTIONS_BY_TYPE[report.type]?.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                    {!isFinalized && status !== "rejected" && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-4 text-gray-500">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Ghi chú Nội bộ / Lý do gửi tới User
                    </label>
                    <textarea
                      className={`w-full border shadow-sm border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none ${isFinalized ? "bg-gray-100 opacity-80 cursor-not-allowed" : "bg-white"}`}
                      placeholder="Nội dung này sẽ lưu lịch sử..."
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      disabled={isFinalized}
                    />
                  </div>

                  <button
                    className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 ${
                      isFinalized
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200"
                    }`}
                    onClick={handleResolve}
                    disabled={isFinalized}
                  >
                    <CheckCircle size={20} />
                    {isFinalized ? "Đã Đóng Xử Lý" : "Thực thi Lệnh"}
                  </button>
                </div>
              </div>

              {/* Lịch sử xử lý */}
              {report.actions?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm border border-gray-200 overflow-hidden">
                  <p className="font-bold text-gray-700 mb-2">
                    Nhật ký Hệ thống:
                  </p>
                  <ul className="space-y-2">
                    {report.actions.map((a, idx) => (
                      <li
                        key={idx}
                        className="bg-white p-3 rounded-lg shadow-sm border border-gray-100"
                      >
                        <p className="font-semibold text-gray-800 text-sm">
                          ✓ Lệnh:{" "}
                          <span className="text-blue-600 truncate">
                            {ACTIONS_BY_TYPE[report.type]?.find(
                              (x) => x.value === a.action,
                            )?.label || a.action}
                          </span>
                        </p>
                        <p className="text-gray-600 italic mt-1 break-words">
                          Ghi chú: "{a.note}"
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider">
                          {new Date(a.at).toLocaleString("vi-VN")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;
