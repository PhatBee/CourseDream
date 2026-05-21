import { useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { AlertTriangle, X } from "lucide-react";

const ReportModal = ({ open, onClose, onSubmit, type = "course" }) => {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const { error, loading } = useSelector((state) => state.report);
  if (!open) return null;

  const REASON_OPTIONS = {
    course: [
      {
        value: "INAPPROPRIATE_CONTENT",
        label: "Nội dung khóa học không phù hợp",
      },
      { value: "COPYRIGHT_VIOLATION", label: "Vi phạm bản quyền" },
      { value: "FRAUD", label: "Lừa đảo / Sai sự thật" },
      { value: "SPAM", label: "Spam hoặc quảng cáo" },
      { value: "OTHER", label: "Khác" },
    ],
    discussion: [
      { value: "INAPPROPRIATE_CONTENT", label: "Vi phạm chính sách cộng đồng" },
      { value: "HARASSMENT", label: "Hành vi không phù hợp / Quấy rối" },
      { value: "SPAM", label: "Nội dung rác / Quảng cáo" },
      { value: "OTHER", label: "Khác" },
    ],
    reply: [
      { value: "INAPPROPRIATE_CONTENT", label: "Vi phạm chính sách cộng đồng" },
      { value: "HARASSMENT", label: "Hành vi không phù hợp / Quấy rối" },
      { value: "SPAM", label: "Nội dung rác / Quảng cáo" },
      { value: "OTHER", label: "Khác" },
    ],
  };

  const currentReasons = REASON_OPTIONS[type] || REASON_OPTIONS.course;

  const handleSend = () => {
    if (!reason) {
      toast.error("Vui lòng chọn lý do báo cáo!");
      return;
    }
    if (reason === "OTHER" && !detail.trim()) {
      toast.error("Vui lòng nhập chi tiết bổ sung khi chọn lý do Khác!");
      return;
    }
    onSubmit(reason, detail);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white/50 backdrop-blur-md rounded-full p-1 transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Header Modal */}
        <div className="bg-rose-500 p-6 flex flex-col items-center justify-center text-white">
          <div className="bg-white/20 p-3 rounded-full mb-3 backdrop-blur-sm">
            <AlertTriangle size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">Báo cáo lạm dụng</h2>
          <p className="text-rose-100 text-sm mt-1 text-center max-w-sm">
            Giúp chúng tôi duy trì môi trường học tập an toàn.
          </p>
        </div>

        {/* Body Modal */}
        <div className="p-6">
          {/* Tối ưu UI Dropdown ở đây */}
          <div className="mb-5 relative">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Loại vấn đề <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full border shadow-sm border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all outline-none cursor-pointer appearance-none bg-white hover:bg-gray-50/80"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="" disabled className="text-gray-400">
                -- Vui lòng chọn một lý do --
              </option>
              {currentReasons.map((r, idx) => (
                <option key={idx} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 top-7 flex items-center px-4 text-gray-400">
              <svg
                className="fill-current h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Chi tiết bổ sung
            </label>
            <textarea
              className="w-full border shadow-sm border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all outline-none resize-none bg-white placeholder-gray-400"
              rows={4}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Vui lòng cung cấp thêm ngữ cảnh cho kiểm duyệt viên..."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center gap-2 font-medium">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gray-900 border appearance-none hover:bg-rose-600 transition-colors shadow-lg shadow-gray-200 flex justify-center items-center gap-2"
              onClick={handleSend}
              disabled={!!error || loading}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                "Gửi báo cáo"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
